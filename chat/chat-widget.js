/* ================================================================
 * Farber.Inc Chat Widget
 * Self-contained: builds the floating bubble + panel, talks to /chat/api.php
 * Designed to be loaded once via /chat/embed.js
 * ================================================================= */
(function () {
  'use strict';
  if (window.__fiChatLoaded) return;
  window.__fiChatLoaded = true;

  // --- Config (override via window.FI_CHAT_CONFIG before this script runs) ----
  var CFG = Object.assign({
    apiEndpoint: '/chat/api.php',
    storageKey: 'fi_chat_v1',
    maxStoredMessages: 50,
    welcomeMessage:
      "Hi — I'm the Farber.Inc concierge. Ask me anything about our services, SEO/AEO/GEO, or working with us.",
    initialPrompts: [
      'What is the difference between SEO, AEO, and GEO?',
      'How long does it take to see results?',
      "What does AI Business Consulting include?",
      "What's your pricing?",
    ],
    siteName: 'Farber.Inc',
    siteUrl: 'https://www.farberinc.media',
    // Booking page URL — surfaced as a "📅 Book a 30-min call" button after
    // a lead submits, and referenced by the bot in conversation. Override
    // per-page by setting window.FI_CHAT_CONFIG.bookingUrl before embed.js runs.
    // Points at the in-site /pages/book.html page which embeds the Google
    // Calendar iframe — this sidesteps both the dead Firebase short URL and
    // any in-app browser that refuses to open calendar.google.com directly.
    bookingUrl: '/pages/book.html',
  }, window.FI_CHAT_CONFIG || {});

  // --- Session + state -----------------------------------------------------
  // Per-request policy: every page load is a fresh chat. The chat does NOT
  // persist messages, lead, or close-prompt state across page loads — that
  // way every user (and every URL) gets a clean conversation with the welcome
  // message and a fresh session id. State is held only in memory for the
  // lifetime of the page so a user can close + reopen the panel without
  // losing context, but the moment they navigate or refresh, it's a new chat.
  var sessionId = makeNewSessionId();
  var state = {
    messages: [],
    lead: null,
    closePromptShown: false,
    welcomed: false,
  };

  function makeNewSessionId() {
    return 'sid_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 10);
  }

  function saveState() {
    // Intentionally a no-op — see "Per-request policy" above.
    // The signature is kept so the rest of the code can call it freely.
  }
  function loadState() {
    // Intentionally a no-op — see "Per-request policy" above.
    return null;
  }
  function clearChat() {
    state = { messages: [], lead: null, closePromptShown: false, welcomed: false };
  }

  // --- Tiny DOM helpers ----------------------------------------------------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // Escape HTML for safe rendering, then apply minimal linkification
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function renderMessageText(text) {
    var escaped = escapeHtml(text);
    // links
    escaped = escaped.replace(
      /\bhttps?:\/\/[^\s<]+/gi,
      function (url) { return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'; }
    );
    // bold
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // bullets: lines starting with "- " become list items
    var lines = escaped.split(/\n/);
    var out = [], inList = false;
    lines.forEach(function (line) {
      if (/^\s*[-*]\s+/.test(line)) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + line.replace(/^\s*[-*]\s+/, '') + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        if (line.trim() === '') out.push('<br>');
        else out.push('<p style="margin:0 0 6px">' + line + '</p>');
      }
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

  // --- Build UI ------------------------------------------------------------
  var launcher, panel, messagesEl, composerEl, inputEl, sendBtn, leadOverlay, closeBar;

  function buildLauncher() {
    launcher = el('button', {
      id: 'fi-chat-launcher',
      type: 'button',
      'aria-label': 'Open chat with ' + CFG.siteName,
      title: 'Chat with ' + CFG.siteName,
    }, [
      el('span', { class: 'fi-launcher-icon', html:
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm3 5h10v2H7V9zm0 4h7v2H7v-2z"/>' +
        '</svg>'
      }),
      el('span', { class: 'fi-launcher-close', html:
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M6 6l12 12M18 6L6 18"/>' +
        '</svg>'
      }),
      el('span', { class: 'fi-launcher-dot', 'aria-hidden': 'true' }),
    ]);
    launcher.addEventListener('click', togglePanel);
    document.body.appendChild(launcher);
  }

  function buildPanel() {
    panel = el('div', { id: 'fi-chat-panel', role: 'dialog', 'aria-label': CFG.siteName + ' chat' });

    // Header
    var header = el('div', { class: 'fi-header' }, [
      el('div', { class: 'fi-header-mark', text: 'F.I' }),
      el('div', { class: 'fi-header-text' }, [
        el('p', { class: 'fi-header-eyebrow', text: 'SEO · AEO · GEO' }),
        el('h2', { class: 'fi-header-title', text: CFG.siteName + ' Concierge' }),
        el('div', { class: 'fi-header-status', text: 'Online · replies in seconds' }),
      ]),
    ]);

    // Messages area
    messagesEl = el('div', { class: 'fi-messages', id: 'fi-chat-messages' });

    // Composer
    composerEl = el('div', { class: 'fi-composer' });
    inputEl = el('textarea', {
      rows: '1',
      placeholder: 'Ask a question…',
      'aria-label': 'Type your message',
      id: 'fi-chat-input',
    });
    sendBtn = el('button', {
      type: 'button',
      'aria-label': 'Send message',
      html:
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M3 11.5l18-8-8 18-2.5-7.5L3 11.5z"/>' +
        '</svg>',
    });
    composerEl.appendChild(inputEl);
    composerEl.appendChild(sendBtn);
    var hint = el('div', {
      class: 'fi-composer-hint',
      text: 'Press Enter to send · Shift+Enter for newline',
    });

    // Footer
    var foot = el('div', { class: 'fi-foot', html:
      'Powered by <a href="' + CFG.siteUrl + '" target="_blank" rel="noopener">' + CFG.siteName + '</a>',
    });

    // Lead overlay
    leadOverlay = el('div', { class: 'fi-lead-overlay', id: 'fi-lead-overlay' });
    buildLeadCard('post_answer'); // will be re-built with different mode when triggered

    // Close bar
    closeBar = buildCloseBar();

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(composerEl);
    panel.appendChild(hint);
    panel.appendChild(foot);
    panel.appendChild(leadOverlay);
    panel.appendChild(closeBar);
    document.body.appendChild(panel);

    // Composer events
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    inputEl.addEventListener('input', autoSize);
    sendBtn.addEventListener('click', sendMessage);

    // Auto-open welcome on first visit (small delay so it doesn't fight the page)
  }

  function autoSize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }

  // --- Lead capture card (re-buildable for "post_answer" vs "on_close") -----
  function buildLeadCard(mode) {
    leadOverlay.innerHTML = '';
    var isClose = mode === 'on_close';
    var card = el('div', { class: 'fi-lead-card' });

    card.appendChild(el('p', {
      class: 'fi-lead-eyebrow',
      text: isClose ? 'Before you go' : 'Stay in touch',
    }));
    card.appendChild(el('h3', {
      text: isClose
        ? 'Mind if we follow up?'
        : 'Can I answer another question, or may I get your details so we can follow up?',
    }));
    card.appendChild(el('p', {
      text: isClose
        ? "If you tell us a little about what you're working on, we'll send you a tailored read — no generic newsletter."
        : "Share your details and a strategist will follow up within one business day with something specific to your situation.",
    }));

    var nameLabel = el('label', { for: 'fi-lead-name', text: 'Name' });
    var nameInput = el('input', { type: 'text', id: 'fi-lead-name', placeholder: 'Alex Rivera', autocomplete: 'name' });
    var emailLabel = el('label', { for: 'fi-lead-email', text: 'Email' });
    var emailInput = el('input', { type: 'email', id: 'fi-lead-email', placeholder: 'alex@company.com', autocomplete: 'email' });

    card.appendChild(nameLabel);
    card.appendChild(nameInput);
    card.appendChild(emailLabel);
    card.appendChild(emailInput);

    var actions = el('div', { class: 'fi-lead-actions' });
    var submit = el('button', { type: 'button', class: 'fi-btn-primary', text: isClose ? 'Save my details' : 'Send my details' });
    var decline = el('button', { type: 'button', class: 'fi-btn-ghost', text: isClose ? 'No thanks' : 'Another question' });
    actions.appendChild(decline);
    actions.appendChild(submit);
    card.appendChild(actions);

    card.appendChild(el('p', {
      class: 'fi-lead-note',
      text: "We use your details only to follow up on this conversation. No third-party sharing.",
    }));

    leadOverlay.appendChild(card);
    leadOverlay.dataset.mode = mode;

    submit.addEventListener('click', function () {
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      if (!name && !email) {
        // nothing entered — treat as decline
        handleLeadDecline(isClose);
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.style.borderColor = '#c33';
        emailInput.focus();
        return;
      }
      var lead = { name: name, email: email, captured_at: new Date().toISOString() };
      state.lead = lead;
      saveState();

      // 1) PRIMARY: hand off to the same StaticForms endpoint the site's
      //    contact form uses. We auto-detect the form's config (action,
      //    apiKey, subject) from the page so the chat stays in sync if
      //    the form is ever updated. If the form isn't on the current
      //    page, we fall back to the defaults captured at build time.
      //    This is what makes the email actually arrive.
      submitLeadToStaticForms(lead);

      // 2) BACKUP: also append to chat/leads.json via the local PHP backend
      //    so you have a downloadable record via SFTP, even if StaticForms
      //    ever hiccups. Fire-and-forget.
      fetch(CFG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          session_id: sessionId,
          lead: lead,
          page: location.pathname,
        }),
      }).catch(function () { /* backup is best-effort */ });

      // Show success state
      card.classList.add('is-saved');
      card.innerHTML = '';
      card.appendChild(el('div', { class: 'fi-lead-checkmark', text: '✓' }));
      card.appendChild(el('h3', { text: 'Saved — we’ll be in touch.' }));
      card.appendChild(el('p', {
        text: 'A Farber.Inc strategist will follow up within one business day. In the meantime, feel free to keep asking questions.',
      }));

      // Primary CTA: book a 30-min call (if a booking URL is configured)
      if (CFG.bookingUrl) {
        var book = el('a', {
          href: CFG.bookingUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'fi-btn-primary fi-btn-book',
          text: '📅  Book a 30-min strategy call',
        });
        book.style.display = 'block';
        book.style.textAlign = 'center';
        book.style.textDecoration = 'none';
        book.style.marginTop = '14px';
        card.appendChild(book);
      }

      var ok = el('button', { type: 'button', class: 'fi-btn-ghost', text: 'Keep chatting' });
      ok.style.marginTop = '10px';
      ok.style.width = '100%';
      ok.addEventListener('click', function () {
        hideLeadOverlay();
        inputEl.focus();
      });
      card.appendChild(ok);
    });

    decline.addEventListener('click', function () { handleLeadDecline(isClose); });
  }

  function handleLeadDecline(isClose) {
    hideLeadOverlay();
    if (!isClose) {
      // The user chose "another question" — just refocus input
      inputEl.focus();
    } else {
      // They declined on close attempt — actually close the panel
      actuallyClosePanel();
    }
  }

  function showLeadOverlay(mode) { buildLeadCard(mode); leadOverlay.classList.add('is-visible'); }
  function hideLeadOverlay()     { leadOverlay.classList.remove('is-visible'); }

  // --- Close bar (the "ask once on close" behavior) -------------------------
  function buildCloseBar() {
    var bar = el('div', { class: 'fi-close-bar', id: 'fi-close-bar' }, [
      el('p', { text: 'Quick one — what should we follow up on?' }),
    ]);
    var share = el('button', { type: 'button', class: 'fi-close-share', text: 'Share details' });
    var decline = el('button', { type: 'button', class: 'fi-close-decline', text: 'Close' });
    bar.appendChild(share);
    bar.appendChild(decline);
    share.addEventListener('click', function () {
      hideCloseBar();
      showLeadOverlay('on_close');
    });
    decline.addEventListener('click', function () { actuallyClosePanel(); });
    return bar;
  }
  function showCloseBar() { closeBar.classList.add('is-visible'); }
  function hideCloseBar() { closeBar.classList.remove('is-visible'); }

  // --- Open / close ---------------------------------------------------------
  function togglePanel() {
    if (panel.classList.contains('is-open')) {
      handleCloseAttempt();
    } else {
      openPanel();
    }
  }
  function openPanel() {
    panel.classList.add('is-open');
    launcher.classList.add('is-open');
    launcher.classList.remove('has-unread');
    launcher.setAttribute('aria-label', 'Close chat');
    hideCloseBar();

    if (!state.welcomed) {
      pushBotMessage(CFG.welcomeMessage, false);
      state.welcomed = true;
      saveState();
      // Append initial prompts as quick-reply chips after the welcome
      setTimeout(renderInitialPrompts, 200);
    }
    setTimeout(function () { inputEl.focus(); }, 100);
  }
  function handleCloseAttempt() {
    // Smart close: if we haven't asked for the lead yet AND the user has chatted
    // (>= 1 exchange), show the close bar once. If already shown, close for real.
    var hadExchange = state.messages.filter(function (m) { return m.role === 'user'; }).length >= 1;
    if (hadExchange && !state.closePromptShown && !state.lead) {
      state.closePromptShown = true;
      saveState();
      showCloseBar();
      return;
    }
    actuallyClosePanel();
  }
  function actuallyClosePanel() {
    panel.classList.remove('is-open');
    launcher.classList.remove('is-open');
    launcher.setAttribute('aria-label', 'Open chat with ' + CFG.siteName);
    hideCloseBar();
  }

  // --- Messages -------------------------------------------------------------
  function pushMessage(role, content) {
    var msg = { role: role, content: content, ts: Date.now() };
    state.messages.push(msg);
    if (state.messages.length > CFG.maxStoredMessages) {
      state.messages = state.messages.slice(-CFG.maxStoredMessages);
    }
    saveState();
    return msg;
  }

  function pushUserMessage(text) {
    var msgEl = renderUserMessage(text);
    messagesEl.appendChild(msgEl);
    pushMessage('user', text);
    scrollToBottom(msgEl);
  }

  function pushBotMessage(text, persist) {
    // Remove the typing indicator BEFORE appending the real message so the
    // scroll anchors to the new reply (not to a soon-to-be-removed bubble).
    hideTyping();
    var msgEl = renderBotMessage(text);
    messagesEl.appendChild(msgEl);
    if (persist !== false) pushMessage('assistant', text);
    scrollToBottom(msgEl);
  }

  function renderUserMessage(text) {
    return el('div', { class: 'fi-msg fi-msg-user', html: renderMessageText(text) });
  }
  function renderBotMessage(text) {
    var wrap = el('div', { class: 'fi-msg fi-msg-bot' });
    wrap.appendChild(el('span', { class: 'fi-msg-sender', text: CFG.siteName + ' Concierge' }));
    wrap.insertAdjacentHTML('beforeend', renderMessageText(text));
    return wrap;
  }

  function renderInitialPrompts() {
    var wrap = el('div', { class: 'fi-msg fi-msg-bot', style: 'background:transparent;border:none;padding:0;max-width:100%;' });
    wrap.appendChild(el('span', { class: 'fi-msg-sender', text: 'Try one of these' }));
    var chips = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;' });
    CFG.initialPrompts.forEach(function (p) {
      var chip = el('button', {
        type: 'button',
        class: 'fi-prompt-chip',
        text: p,
        style:
          'background:var(--fi-cream);border:1px solid var(--fi-gold);color:var(--fi-navy);' +
          'border-radius:999px;padding:6px 12px;font-size:12px;cursor:pointer;' +
          'font-family:var(--fi-font-body);transition:background 0.15s;',
      });
      chip.addEventListener('mouseenter', function () { chip.style.background = 'var(--fi-gold)'; });
      chip.addEventListener('mouseleave', function () { chip.style.background = 'var(--fi-cream)'; });
      chip.addEventListener('click', function () {
        chip.remove();
        inputEl.value = p;
        sendMessage();
      });
      chips.appendChild(chip);
    });
    wrap.appendChild(chips);
    messagesEl.appendChild(wrap);
    scrollToBottom(wrap);
  }

  /**
   * Scroll the messages area to show the latest message in full.
   *
   * Why three attempts:
   *  - rAF (frame 1)   → after the browser has laid out the new DOM
   *  - setTimeout 120  → after web fonts (Inter, Playfair) have swapped in
   *                      and may have shifted the layout
   *  - setTimeout 400  → covers any late async content (links being styled,
   *                      bold/paragraph re-wrap, typing indicator removal
   *                      followed by the real message)
   *
   * Uses scrollIntoView({block:'end'}) on the newest message so we anchor
   * to the actual reply, not just the bottom of the container.
   */
  function scrollToBottom(target) {
    var el = target || messagesEl.lastElementChild;
    var doScroll = function () {
      if (el && el.scrollIntoView) {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'end' }); return; }
        catch (e) { /* fall through */ }
      }
      messagesEl.scrollTop = messagesEl.scrollHeight;
    };
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 120);
    setTimeout(doScroll, 400);
  }

  function showTyping() {
    var t = el('div', { class: 'fi-typing', id: 'fi-typing' }, [
      el('span'), el('span'), el('span'),
    ]);
    messagesEl.appendChild(t);
    scrollToBottom();
  }
  function hideTyping() {
    var t = document.getElementById('fi-typing');
    if (t) t.remove();
  }

  // --- Send -----------------------------------------------------------------
  var inFlight = false;
  function sendMessage() {
    if (inFlight) return;
    var text = (inputEl.value || '').trim();
    if (!text) return;

    // Strip any leading/trailing whitespace, cap at 2000 chars (sanity)
    if (text.length > 2000) text = text.slice(0, 2000);

    inputEl.value = '';
    autoSize();
    inputEl.disabled = true;
    sendBtn.disabled = true;

    pushUserMessage(text);
    showTyping();

    inFlight = true;
    fetch(CFG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat',
        session_id: sessionId,
        page: location.pathname,
        messages: state.messages,
        lead: state.lead,
      }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (resp) {
        hideTyping();
        if (!resp.ok || !resp.j || !resp.j.reply) {
          var errMsg = (resp.j && resp.j.error) || 'Sorry — I had trouble reaching the team. Try again in a moment, or email farber.inc@gmail.com directly.';
          pushBotMessage(errMsg);
        } else {
          pushBotMessage(resp.j.reply);
        }
        // After the bot's first reply in a fresh session, surface the lead form
        // as a soft prompt (only if no lead yet, and not already prompted)
        maybePromptForLead();
      })
      .catch(function () {
        hideTyping();
        pushBotMessage("I'm having a connection issue. Please try again, or reach the team directly at farber.inc@gmail.com or 772-310-8202.");
        maybePromptForLead();
      })
      .then(function () {
        inFlight = false;
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
      });
  }

  var leadPromptPending = false;
  function maybePromptForLead() {
    if (state.lead || leadPromptPending) return;
    // Only show the lead prompt after the user has asked >= 1 question
    // AND we've already given at least one bot answer.
    var userTurns = state.messages.filter(function (m) { return m.role === 'user'; }).length;
    var botTurns  = state.messages.filter(function (m) { return m.role === 'assistant'; }).length;
    if (userTurns < 1 || botTurns < 1) return;
    if (state.closePromptShown) return; // already nudged once on close

    leadPromptPending = true;
    setTimeout(function () {
      // Append an in-chat prompt (not the overlay — just a soft ask in the conversation)
      // The actual modal lead overlay is reserved for the close-attempt path.
      var promptMsg =
        "If it's easier, I can have a strategist follow up — " +
        "share your name and email here or use the form on our contact page. " +
        "Or feel free to keep asking questions.";
      pushBotMessage(promptMsg);
    }, 1200);
  }

  // --- Replay history on load ------------------------------------------------
  // Currently a no-op: per the "Per-request policy" above, every page load
  // starts with an empty state and a new sessionId, so there's nothing to
  // replay. Kept as a function so the rest of the code can stay symmetric.
  function renderHistory() { /* no-op */ }

  // --- Init -----------------------------------------------------------------
  function init() {
    buildLauncher();
    buildPanel();
    // No history restoration — every page load is a fresh chat.

    // Keep the latest message in view if the panel resizes (mobile keyboard
    // opening, window resize, font load, etc.). Only auto-scroll if the user
    // is already near the bottom — don't yank them away from older messages
    // they might be reading.
    var resizeHandler = function () {
      if (!panel.classList.contains('is-open')) return;
      var slack = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight;
      if (slack < 120) scrollToBottom();
    };
    window.addEventListener('resize', resizeHandler);
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(resizeHandler).observe(messagesEl);
      } catch (e) { /* ResizeObserver not available, window resize is enough */ }
    }

    // Pre-warm: ping the API so we surface config errors early
    fetch(CFG.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ping', session_id: sessionId }) })
      .catch(function () { /* ignore */ });
  }

  // --- StaticForms handoff -------------------------------------------------
  // The site's contact form posts to api.staticforms.dev using the same
  // apiKey/subject/redirectTo as the page-level form. We mirror that here
  // so the same email pipeline that delivers contact-form submissions
  // also delivers chat leads.

  // Defaults match the values in index.html (and all other pages that
  // embed the .fi-contact-form). If you ever rotate the apiKey, update
  // BOTH the form and this constant — or, better, always rely on the
  // page-detected values below.
  var STATICFORMS_DEFAULTS = {
    action:   'https://api.staticforms.dev/submit',
    apiKey:   'sf_c49289756d9e68bedab13963',
    subject:  'Farber.Inc chat lead',
    replyTo:  '', // optional, set if you want replies routed somewhere specific
  };

  // Pulls action / apiKey / subject from the page's contact form so the
  // chat always stays in sync with the static form. Cached after first call.
  var _sfConfig = null;
  function getStaticFormsConfig() {
    if (_sfConfig) return _sfConfig;
    var cfg = Object.assign({}, STATICFORMS_DEFAULTS);
    try {
      var f = document.querySelector('.fi-contact-form, .farber-branded-form');
      if (f) {
        if (f.action) cfg.action = f.action;
        var apiKeyEl = f.querySelector('input[name="apiKey"]');
        if (apiKeyEl && apiKeyEl.value) cfg.apiKey = apiKeyEl.value;
        var subjectEl = f.querySelector('input[name="subject"]');
        if (subjectEl && subjectEl.value) cfg.subject = subjectEl.value;
      }
    } catch (e) { /* fall back to defaults */ }
    _sfConfig = cfg;
    return cfg;
  }

  function submitLeadToStaticForms(lead) {
    var cfg = getStaticFormsConfig();
    var firstUser = (state.messages.find(function (m) { return m.role === 'user'; }) || {}).content || '';
    var convo = state.messages
      .map(function (m) { return (m.role === 'user' ? 'Visitor' : 'Concierge') + ': ' + m.content; })
      .join('\n\n');

    var body = '[Farber.Inc Chat Lead]'
             + '\nName:  ' + lead.name
             + '\nEmail: ' + lead.email
             + '\nPage:  ' + location.pathname
             + '\nWhen:  ' + lead.captured_at
             + (firstUser ? '\n\nFirst question:\n' + firstUser : '')
             + '\n\n--- Full conversation ---\n' + convo;

    var fd = new FormData();
    fd.append('apiKey',   cfg.apiKey);
    fd.append('subject',  cfg.subject);
    fd.append('name',     lead.name);
    fd.append('email',    lead.email);
    fd.append('message',  body);
    if (cfg.replyTo) fd.append('replyTo', cfg.replyTo);

    return fetch(cfg.action, { method: 'POST', body: fd, mode: 'no-cors' })
      .catch(function (e) { /* email is best-effort, lead still saved locally */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

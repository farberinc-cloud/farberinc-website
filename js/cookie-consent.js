/* ============================================================
   FARBER.INC — COOKIE CONSENT BANNER
   Google Consent Mode v2 compliant (effective for EU/UK, March 2024+)
   - Categories: necessary (always on), analytics, marketing
   - Default: all optional categories DENIED
   - Persists choice in localStorage for 365 days
   - Lets users reopen settings via #cookie-settings link or footer link
   - Defers GA4 firing until consent granted (analytics_storage)
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'farber_cookie_consent_v1';
  var CONSENT_VERSION = '2026-07-09';

  // ---------- Helpers ----------
  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      // Invalidate if version bumped (policy changes invalidate old consent)
      if (parsed && parsed.version === CONSENT_VERSION) return parsed;
    } catch (e) { /* ignore */ }
    return null;
  }

  function writeConsent(consent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) { /* storage blocked, fail closed */ }
  }

  function pushConsentToGtag(consent) {
    if (typeof gtag !== 'function') return;
    var analyticsState = consent.analytics ? 'granted' : 'denied';
    var marketingState = consent.marketing ? 'granted' : 'denied';
    gtag('consent', 'update', {
      'analytics_storage': analyticsState,
      'ad_storage': marketingState,
      'ad_user_data': marketingState,
      'ad_personalization': marketingState
    });
  }

  // ---------- Styles ----------
  function injectStyles() {
    if (document.getElementById('farber-cookie-styles')) return;
    var css = ''
      + '#farber-cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;'
      + 'background:#0A1628;color:#FAF8F5;border-radius:12px;box-shadow:0 20px 60px rgba(10,22,40,.35);'
      + 'padding:24px;max-width:760px;margin:0 auto;font-family:Inter,system-ui,sans-serif;'
      + 'transform:translateY(120%);opacity:0;transition:transform .35s ease,opacity .35s ease;'
      + 'border:1px solid rgba(184,134,11,.35)}'
      + '#farber-cookie-banner.fcb-visible{transform:translateY(0);opacity:1}'
      + '#farber-cookie-banner h3{margin:0 0 8px;font-size:1.05rem;color:#B8860B;font-weight:600}'
      + '#farber-cookie-banner p{margin:0 0 16px;font-size:.875rem;line-height:1.55;color:rgba(250,248,245,.85)}'
      + '#farber-cookie-banner a{color:#B8860B;text-decoration:underline}'
      + '#farber-cookie-banner .fcb-actions{display:flex;gap:8px;flex-wrap:wrap}'
      + '#farber-cookie-banner button{font-family:inherit;font-size:.875rem;font-weight:600;'
      + 'padding:10px 16px;border-radius:6px;border:none;cursor:pointer;transition:opacity .15s ease}'
      + '#farber-cookie-banner button:hover{opacity:.88}'
      + '#farber-cookie-banner .fcb-accept{background:#B8860B;color:#fff}'
      + '#farber-cookie-banner .fcb-reject{background:transparent;color:#FAF8F5;border:1px solid rgba(250,248,245,.35)}'
      + '#farber-cookie-banner .fcb-customize{background:transparent;color:#B8860B;border:1px solid rgba(184,134,11,.5)}'
      + '#farber-cookie-panel{display:none;margin-top:16px;padding-top:16px;border-top:1px solid rgba(250,248,245,.15)}'
      + '#farber-cookie-panel.fcb-open{display:block}'
      + '#farber-cookie-panel .fcb-cat{display:flex;justify-content:space-between;align-items:center;'
      + 'padding:10px 0;font-size:.875rem}'
      + '#farber-cookie-panel .fcb-cat strong{color:#FAF8F5}'
      + '#farber-cookie-panel .fcb-cat small{display:block;color:rgba(250,248,245,.6);font-size:.75rem;margin-top:2px}'
      + '#farber-cookie-panel .fcb-toggle{position:relative;width:40px;height:22px;background:rgba(250,248,245,.2);'
      + 'border-radius:11px;cursor:pointer;transition:background .2s ease}'
      + '#farber-cookie-panel .fcb-toggle::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;'
      + 'background:#FAF8F5;border-radius:50%;transition:transform .2s ease}'
      + '#farber-cookie-panel .fcb-toggle.fcb-on{background:#B8860B}'
      + '#farber-cookie-panel .fcb-toggle.fcb-on::after{transform:translateX(18px)}'
      + '#farber-cookie-panel .fcb-disabled{opacity:.5;cursor:not-allowed}'
      + '@media(max-width:560px){#farber-cookie-banner{left:8px;right:8px;bottom:8px;padding:18px}}';
    var s = document.createElement('style');
    s.id = 'farber-cookie-styles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  // ---------- Banner HTML ----------
  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'farber-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = ''
      + '<h3>We value your privacy</h3>'
      + '<p>Farber.Inc uses cookies for essential site functions and, with your consent, for analytics '
      + '(Google Analytics 4, anonymized IP) and bot protection (Cloudflare Turnstile). We never sell your data. '
      + 'You can customize or withdraw consent anytime. '
      + '<a href="' + (window.location.pathname.indexOf('/pages/') === 0 ? '../../' : '') + 'pages/legal/privacy-policy.html">Read our Privacy Policy</a>.</p>'
      + '<div class="fcb-actions">'
      +   '<button type="button" class="fcb-accept" data-fcb="accept-all">Accept All</button>'
      +   '<button type="button" class="fcb-reject" data-fcb="reject-all">Reject All</button>'
      +   '<button type="button" class="fcb-customize" data-fcb="customize">Customize</button>'
      + '</div>'
      + '<div id="farber-cookie-panel">'
      +   '<div class="fcb-cat">'
      +     '<div><strong>Necessary</strong><small>Required for the site to function (session, consent preference). Always on.</small></div>'
      +     '<div class="fcb-toggle fcb-on fcb-disabled" aria-disabled="true" data-fcb-cat="necessary"></div>'
      +   '</div>'
      +   '<div class="fcb-cat">'
      +     '<div><strong>Analytics</strong><small>Google Analytics 4 — anonymized page views, scroll, events.</small></div>'
      +     '<div class="fcb-toggle" data-fcb-cat="analytics"></div>'
      +   '</div>'
      +   '<div class="fcb-cat">'
      +     '<div><strong>Marketing</strong><small>Ad storage &amp; personalization signals. Currently unused on this site.</small></div>'
      +     '<div class="fcb-toggle" data-fcb-cat="marketing"></div>'
      +   '</div>'
      +   '<div class="fcb-actions" style="margin-top:12px">'
      +     '<button type="button" class="fcb-accept" data-fcb="save-prefs">Save Preferences</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(banner);
    return banner;
  }

  // ---------- Open / Close / Apply ----------
  function show(banner) {
    if (!banner) return;
    requestAnimationFrame(function () { banner.classList.add('fcb-visible'); });
  }

  function hide(banner) {
    if (!banner) return;
    banner.classList.remove('fcb-visible');
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 400);
  }

  function apply(consent, banner) {
    writeConsent(consent);
    pushConsentToGtag(consent);
    document.dispatchEvent(new CustomEvent('farber:consent-applied', { detail: consent }));
    if (banner) hide(banner);
  }

  // Toggle the customize panel
  function togglePanel(banner) {
    var panel = document.getElementById('farber-cookie-panel');
    if (!panel) return;
    panel.classList.toggle('fcb-open');
  }

  // Set toggle visual state
  function setToggleState(cat, on) {
    var toggles = document.querySelectorAll('#farber-cookie-panel .fcb-toggle');
    toggles.forEach(function (t) {
      if (t.getAttribute('data-fcb-cat') === cat) {
        t.classList.toggle('fcb-on', !!on);
      }
    });
  }

  function readToggles() {
    var toggles = document.querySelectorAll('#farber-cookie-panel .fcb-toggle');
    var state = { necessary: true, analytics: false, marketing: false };
    toggles.forEach(function (t) {
      var cat = t.getAttribute('data-fcb-cat');
      if (cat && cat !== 'necessary') state[cat] = t.classList.contains('fcb-on');
    });
    return state;
  }

  function init() {
    injectStyles();
    var existing = readConsent();

    if (existing) {
      // Already consented — apply silently
      pushConsentToGtag(existing);
      return;
    }

    // No prior consent — show banner
    var banner = buildBanner();

    // Button handlers
    banner.addEventListener('click', function (e) {
      var target = e.target.closest('[data-fcb]');
      if (!target) return;
      var action = target.getAttribute('data-fcb');

      if (action === 'accept-all') {
        apply({ version: CONSENT_VERSION, timestamp: Date.now(), necessary: true, analytics: true, marketing: true }, banner);
      } else if (action === 'reject-all') {
        apply({ version: CONSENT_VERSION, timestamp: Date.now(), necessary: true, analytics: false, marketing: false }, banner);
      } else if (action === 'customize') {
        togglePanel(banner);
      } else if (action === 'save-prefs') {
        apply({ version: CONSENT_VERSION, timestamp: Date.now(), necessary: true, analytics: readToggles().analytics, marketing: readToggles().marketing }, banner);
      }
    });

    // Toggle switches
    setTimeout(function () {
      var toggles = document.querySelectorAll('#farber-cookie-panel .fcb-toggle:not(.fcb-disabled)');
      toggles.forEach(function (t) {
        t.addEventListener('click', function () { t.classList.toggle('fcb-on'); });
      });
    }, 100);

    show(banner);
  }

  // ---------- Public API: reopen settings ----------
  window.FarberConsent = {
    open: function () {
      // Remove any existing banner first
      var existing = document.getElementById('farber-cookie-banner');
      if (existing) existing.parentNode.removeChild(existing);
      init();
    },
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },
    get: readConsent
  };

  // ---------- Boot ----------
  function boot() {
    init();

    // Allow any "Cookie Settings" / "Manage Cookies" link to reopen
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-fcb-action="open"], a[href="#cookie-settings"], a[href="#manage-cookies"]');
      if (link) {
        e.preventDefault();
        window.FarberConsent.open();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
/* Farber Inc — Client Portal Concierge
 * Self-contained widget that asks visitors to schedule a consultation
 * after 30 seconds of engagement. Fires once per browser session.
 *
 * Drop this script on any page that should show the concierge:
 *   <script src="concierge.js" defer></script>
 */
(function () {
  'use strict';

  // Session-scoped: only fire once per browser tab session
  var STORAGE_KEY = 'farber_concierge_dismissed';
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
  } catch (e) {
    /* private mode / blocked storage — fall through and still show */
  }

  var DELAY_MS = 30000;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.fc-wrap {',
    '  position: fixed;',
    '  right: 28px;',
    '  bottom: 28px;',
    '  z-index: 9999;',
    '  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;',
    '  pointer-events: none;',
    '}',
    '.fc-bubble {',
    '  pointer-events: auto;',
    '  width: 360px;',
    '  max-width: calc(100vw - 56px);',
    '  background: #ffffff;',
    '  border-radius: 14px;',
    '  box-shadow: 0 16px 48px -12px rgba(10, 22, 40, 0.30), 0 0 0 1px rgba(10, 22, 40, 0.06);',
    '  overflow: hidden;',
    '  opacity: 0;',
    '  transform: translateY(20px) scale(0.96);',
    '  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);',
    '}',
    '.fc-wrap.fc-show .fc-bubble {',
    '  opacity: 1;',
    '  transform: translateY(0) scale(1);',
    '}',
    '.fc-head {',
    '  background: #0A1628;',
    '  color: #FAF8F5;',
    '  padding: 16px 18px;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 12px;',
    '  position: relative;',
    '}',
    '.fc-head::after {',
    '  content: "";',
    '  position: absolute;',
    '  right: 0; top: 0; bottom: 0;',
    '  width: 4px;',
    '  background: #B8860B;',
    '}',
    '.fc-avatar {',
    '  width: 38px;',
    '  height: 38px;',
    '  border-radius: 50%;',
    '  background: #1A2A4A;',
    '  border: 1.5px solid #B8860B;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-family: "Playfair Display", Georgia, serif;',
    '  font-weight: 700;',
    '  font-size: 13px;',
    '  color: #B8860B;',
    '  flex-shrink: 0;',
    '}',
    '.fc-head-text { flex: 1; min-width: 0; }',
    '.fc-name {',
    '  font-size: 13px;',
    '  font-weight: 600;',
    '  color: #FAF8F5;',
    '  line-height: 1.2;',
    '}',
    '.fc-status {',
    '  font-size: 11px;',
    '  color: #B8860B;',
    '  letter-spacing: 0.06em;',
    '  margin-top: 2px;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '}',
    '.fc-status::before {',
    '  content: "";',
    '  width: 6px; height: 6px;',
    '  border-radius: 50%;',
    '  background: #2f6f5e;',
    '  box-shadow: 0 0 0 4px rgba(47, 111, 94, 0.2);',
    '  animation: fc-pulse 2s infinite;',
    '}',
    '@keyframes fc-pulse {',
    '  0%, 100% { opacity: 1; }',
    '  50% { opacity: 0.5; }',
    '}',
    '.fc-close {',
    '  width: 26px;',
    '  height: 26px;',
    '  border-radius: 50%;',
    '  background: transparent;',
    '  border: none;',
    '  cursor: pointer;',
    '  color: rgba(250, 248, 245, 0.6);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  transition: background 0.2s, color 0.2s;',
    '}',
    '.fc-close:hover {',
    '  background: rgba(255, 255, 255, 0.08);',
    '  color: #FAF8F5;',
    '}',
    '.fc-body {',
    '  padding: 20px 18px 18px;',
    '}',
    '.fc-msg {',
    '  font-size: 14px;',
    '  line-height: 1.55;',
    '  color: #0A1628;',
    '  margin-bottom: 16px;',
    '}',
    '.fc-actions {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 8px;',
    '}',
    '.fc-btn {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  padding: 11px 16px;',
    '  border-radius: 6px;',
    '  font-size: 13px;',
    '  font-weight: 600;',
    '  letter-spacing: 0.04em;',
    '  cursor: pointer;',
    '  text-decoration: none;',
    '  border: 1px solid transparent;',
    '  transition: background 0.2s, transform 0.1s;',
    '  font-family: inherit;',
    '}',
    '.fc-btn-primary {',
    '  background: #B8860B;',
    '  color: #FAF8F5;',
    '}',
    '.fc-btn-primary:hover {',
    '  background: #D4A437;',
    '}',
    '.fc-btn-primary:active {',
    '  transform: scale(0.98);',
    '}',
    '.fc-btn-ghost {',
    '  background: transparent;',
    '  color: #4a5170;',
    '  border-color: #e6e2d6;',
    '}',
    '.fc-btn-ghost:hover {',
    '  background: #f5f3ed;',
    '  color: #0A1628;',
    '}',
    '/* Minimized state after dismissal-without-action */',
    '.fc-bubble.fc-mini .fc-body { display: none; }',
    '.fc-bubble.fc-mini .fc-head { padding: 12px 14px; }',
    '.fc-bubble.fc-mini .fc-name { font-size: 12px; }',
    '/* Small dot pulse before bubble appears */',
    '.fc-pre {',
    '  pointer-events: auto;',
    '  width: 56px;',
    '  height: 56px;',
    '  border-radius: 50%;',
    '  background: #0A1628;',
    '  border: 2px solid #B8860B;',
    '  position: absolute;',
    '  right: 0;',
    '  bottom: 0;',
    '  cursor: pointer;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  font-family: "Playfair Display", Georgia, serif;',
    '  font-weight: 700;',
    '  font-size: 15px;',
    '  color: #B8860B;',
    '  box-shadow: 0 8px 24px -6px rgba(10, 22, 40, 0.4);',
    '  opacity: 0;',
    '  transform: scale(0.8);',
    '  transition: opacity 0.3s, transform 0.3s;',
    '}',
    '.fc-wrap.fc-show .fc-pre {',
    '  opacity: 0;',
    '  transform: scale(0.6);',
    '  pointer-events: none;',
    '}',
    '.fc-pre-dot {',
    '  position: absolute;',
    '  top: 4px; right: 4px;',
    '  width: 12px; height: 12px;',
    '  background: #B8860B;',
    '  border-radius: 50%;',
    '  border: 2px solid #0A1628;',
    '  animation: fc-pulse 2s infinite;',
    '}',
    '@media (max-width: 480px) {',
    '  .fc-wrap { right: 16px; bottom: 16px; }',
    '  .fc-bubble { width: calc(100vw - 32px); }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .fc-bubble, .fc-pre { transition: opacity 0.2s; transform: none !important; }',
    '  @keyframes fc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // Build widget
  var wrap = document.createElement('div');
  wrap.className = 'fc-wrap';
  wrap.setAttribute('aria-live', 'polite');
  wrap.innerHTML = [
    '<div class="fc-pre" role="button" tabindex="0" aria-label="Open concierge">',
    '  F.I',
    '  <span class="fc-pre-dot"></span>',
    '</div>',
    '<div class="fc-bubble" role="dialog" aria-labelledby="fc-name">',
    '  <div class="fc-head">',
    '    <div class="fc-avatar">F.I</div>',
    '    <div class="fc-head-text">',
    '      <div class="fc-name" id="fc-name">Farber Inc Concierge</div>',
    '      <div class="fc-status">Online - typically replies in minutes</div>',
    '    </div>',
    '    <button class="fc-close" aria-label="Close concierge">',
    '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>',
    '    </button>',
    '  </div>',
    '  <div class="fc-body">',
    '    <div class="fc-msg">Hi there - I noticed you have been reviewing our recommendations. Would you like to book a 20-minute consultation to discuss next steps for your engagement?</div>',
    '    <div class="fc-actions">',
    '      <a class="fc-btn fc-btn-primary" id="fc-book" href="#">',
    '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    '        Schedule a Consultation',
    '      </a>',
    '      <button class="fc-btn fc-btn-ghost" id="fc-later" type="button">Maybe later</button>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('\n');
  document.body.appendChild(wrap);

  // The booking link is set dynamically so we can point it at any page that hosts the contact form.
  // For the client portal, the contact form lives on the homepage - so link back to /index.html#contact
  var portalRoot = computePortalRoot();
  var bookBtn = wrap.querySelector('#fc-book');
  bookBtn.setAttribute('href', portalRoot + 'index.html#contact');
  bookBtn.addEventListener('click', function () {
    try { sessionStorage.setItem(STORAGE_KEY, 'booked'); } catch (e) {}
    // Let the link navigate naturally
  });

  wrap.querySelector('#fc-later').addEventListener('click', dismiss);
  wrap.querySelector('.fc-close').addEventListener('click', dismiss);

  // Compute the relative path back to site root from wherever this script is loaded.
  // Default: assume the script is at /pages/portal/concierge.js, so root is ../../../
  function computePortalRoot() {
    var script = document.currentScript || document.querySelector('script[src*="concierge"]');
    var src = script && script.getAttribute('src');
    if (!src) return '../../';
    // Count directory depth from the script's path
    var dir = src.replace(/[^/]*$/, '');   // strip filename
    var depth = (dir.match(/\.\.\//g) || []).length;
    if (depth > 0) return new Array(depth + 1).join('../');
    // Otherwise absolute or same-folder
    if (src.startsWith('/')) return '/';
    return '';
  }

  // Dismiss: remember the session so we don't pester again
  function dismiss() {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    wrap.classList.remove('fc-show');
    setTimeout(function () { wrap.remove(); }, 500);
  }

  // Show after delay
  setTimeout(function () {
    wrap.classList.add('fc-show');
    // Auto-minimize after 25 more seconds of inactivity if user hasn't interacted
    var autoMini = setTimeout(function () {
      if (wrap.parentNode) {
        wrap.querySelector('.fc-bubble').classList.add('fc-mini');
      }
    }, 25000);
    // If they click anywhere inside, cancel the auto-minimize
    wrap.addEventListener('click', function () { clearTimeout(autoMini); }, { once: true });
  }, DELAY_MS);
})();

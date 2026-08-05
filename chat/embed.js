/* Farber.Inc Chat — Embed Loader
 * One-line drop-in:  <script src="/chat/embed.js" defer></script>
 * Loads the brand-matched CSS and the chat widget on any page.
 *
 * The `?v=` cache-buster below is bumped manually whenever chat-widget.js
 * or chat-widget.css get meaningful changes — without it, Hostinger's
 * `cache-control: public, max-age=3600` keeps the user pinned to the old
 * version even after a hard refresh, because the HTML is cached too.
 */
(function () {
  if (window.__fiChatEmbed) return;
  window.__fiChatEmbed = true;

  // Bump this any time chat-widget.js / chat-widget.css change in a way
  // that affects rendering. Don't bump for prompt-only changes (those are
  // server-side and don't need a cache-bust).
  var V = '3';

  var base = (function () {
    var s = document.currentScript;
    if (!s) return '/chat/';
    var src = s.getAttribute('src') || '/chat/embed.js';
    return src.replace(/embed\.js$/, '');
  })();

  // Inject the widget stylesheet (cache-busted)
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base + 'chat-widget.css?v=' + V;
  document.head.appendChild(css);

  // Pre-load Google fonts (Playfair Display + Inter + Montserrat) if not already
  if (!document.getElementById('fi-chat-fonts')) {
    var link = document.createElement('link');
    link.id = 'fi-chat-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&family=Playfair+Display:wght@400;600&display=swap';
    document.head.appendChild(link);
  }

  // Load the widget script (cache-busted)
  var s = document.createElement('script');
  s.src = base + 'chat-widget.js?v=' + V;
  s.defer = true;
  document.body.appendChild(s);
})();

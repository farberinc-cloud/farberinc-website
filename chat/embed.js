/* Farber.Inc Chat — Embed Loader
 * One-line drop-in:  <script src="/chat/embed.js" defer></script>
 * Loads the brand-matched CSS and the chat widget on any page.
 */
(function () {
  if (window.__fiChatEmbed) return;
  window.__fiChatEmbed = true;
  var base = (function () {
    var s = document.currentScript;
    if (!s) return '/chat/';
    var src = s.getAttribute('src') || '/chat/embed.js';
    return src.replace(/embed\.js$/, '');
  })();

  // Inject the widget stylesheet
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base + 'chat-widget.css';
  document.head.appendChild(css);

  // Pre-load Google fonts (Playfair Display + Inter + Montserrat) if not already
  if (!document.getElementById('fi-chat-fonts')) {
    var link = document.createElement('link');
    link.id = 'fi-chat-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&family=Playfair+Display:wght@400;600&display=swap';
    document.head.appendChild(link);
  }

  // Load the widget script
  var s = document.createElement('script');
  s.src = base + 'chat-widget.js';
  s.defer = true;
  document.body.appendChild(s);
})();

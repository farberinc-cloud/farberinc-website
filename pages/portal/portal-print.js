/* Print / Save as PDF for every client-facing portal card. */
(function () {
  var CARD = '.rec-card, .workspace-card, .audit-card, .phase';

  function button() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fi-print-btn';
    b.textContent = 'Print PDF';
    return b;
  }

  function addCardButtons() {
    document.querySelectorAll(CARD).forEach(function (card) {
      if (card.querySelector('.fi-print-btn')) return;
      card.appendChild(button());
    });
  }

  function addPageButton() {
    var inner = document.querySelector('.audit-bar .inner');
    if (!inner || inner.querySelector('.fi-print-page')) return;
    var b = button();
    b.classList.add('fi-print-page');
    b.textContent = 'Print PDF';
    inner.appendChild(b);
  }

  function sheet(card) {
    var clone = card.cloneNode(true);
    clone.querySelectorAll('.fi-print-btn, .card-actions').forEach(function (n) { n.remove(); });
    var stage = document.getElementById('fi-print-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'fi-print-stage';
      document.body.appendChild(stage);
    }
    var title = (clone.querySelector('h2, h4, .card-name, .card-title') || {}).textContent || document.title;
    title = (title || '').trim();
    stage.innerHTML =
      '<article class="fi-print-sheet">' +
        '<header class="fi-print-letterhead">' +
          '<div class="who">' +
            '<img src="/icons/farber-inc-logo.png" alt="Farber.Inc">' +
            '<div><div class="fi-print-brand">Farber.Inc</div><div class="fi-print-kicker">Client portal</div></div>' +
          '</div>' +
          '<div class="fi-print-conf">Confidential<br>Client use only</div>' +
        '</header>' +
        '<div class="fi-print-body"></div>' +
        '<footer class="fi-print-foot"><span>' + escapeHtml(title) + '</span><span>Farber.Inc · farberinc.media</span></footer>' +
        '<p class="fi-print-disclaimer">' + escapeHtml(disclaimerFor(card)) + '</p>' +
      '</article>';
    stage.querySelector('.fi-print-body').appendChild(clone);
    return stage;
  }

  var AGREEMENTS = {
    seo: 'Disclaimer: Any agreement is governed by the Farber.Inc SEO Master Agreement (https://www.farberinc.media/pages/legal/seo-agreement.html). Payment of any SOW (Schedule of Work) constitutes compliance with and acceptance of that agreement.',
    ai: 'Disclaimer: Any agreement is governed by the Farber.Inc AI Consulting Master Agreement (https://www.farberinc.media/pages/legal/ai-consulting-agreement.html). Payment of any SOW (Schedule of Work) constitutes compliance with and acceptance of that agreement.'
  };

  function kindIn(el) {
    if (!el || !el.getAttribute) return null;
    var marked = el.getAttribute('data-agreement');
    if (marked === 'ai' || marked === 'seo') return marked;
    var html = el.innerHTML || '';
    var ai = /ai-consulting-agreement\.html/i.test(html);
    var seo = /seo-agreement\.html/i.test(html);
    if (ai && !seo) return 'ai';
    if (seo && !ai) return 'seo';
    return null;
  }

  function kindFor(node) {
    var el = node || document.body;
    while (el) {
      var kind = kindIn(el);
      if (kind) return kind;
      el = el.parentElement;
    }
    return 'seo';
  }

  function disclaimerFor(node) {
    return AGREEMENTS[kindFor(node)];
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&' + 'amp;')
      .replace(/</g, '&' + 'lt;')
      .replace(/>/g, '&' + 'gt;')
      .replace(/"/g, '&' + 'quot;');
  }

  function printCard(card) {
    sheet(card);
    document.body.classList.add('fi-print-one');
    var cleanup = function () {
      document.body.classList.remove('fi-print-one');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.fi-print-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (btn.classList.contains('fi-print-page')) {
      document.body.classList.remove('fi-print-one');
      window.print();
      return;
    }
    var card = btn.closest(CARD);
    if (card) printCard(card);
    else window.print();
  });

  function init() {
    addCardButtons();
    addPageButton();
    if (!document.querySelector('body > .fi-print-disclaimer')) {
      var note = document.createElement('p');
      note.className = 'fi-print-disclaimer';
      note.textContent = disclaimerFor(document.body);
      document.body.appendChild(note);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

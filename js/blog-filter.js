/**
 * Farber.Inc Blog Filter
 * Lightweight client-side filter for the Latest News page.
 * No dependencies. Hides cards that don't match the active filter.
 */
(function () {
  'use strict';

  const pills = document.querySelectorAll('.blog-category-pill');
  const cards = document.querySelectorAll('.blog-card[data-category]');
  const empty = document.querySelector('.blog-empty');

  if (!pills.length || !cards.length) return;

  function applyFilter(filter) {
    let visibleCount = 0;
    cards.forEach((card) => {
      const cat = (card.getAttribute('data-category') || '').toLowerCase();
      const matches = filter === 'all' || cat === filter;
      if (matches) {
        card.classList.remove('is-hidden');
        visibleCount++;
      } else {
        card.classList.add('is-hidden');
      }
    });

    if (empty) {
      empty.classList.toggle('is-visible', visibleCount === 0);
    }

    // Fire analytics event
    if (window.gtag) {
      gtag('event', 'blog_filter', {
        filter_category: filter,
        visible_count: visibleCount,
      });
    }
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = (pill.getAttribute('data-filter') || 'all').toLowerCase();

      pills.forEach((p) => p.classList.remove('is-active'));
      pill.classList.add('is-active');

      applyFilter(filter);

      // Update URL hash without jumping
      if (history.replaceState) {
        history.replaceState(null, '', filter === 'all' ? '#all' : '#' + filter);
      }
    });
  });

  // Apply filter from URL hash on load
  const initial = (window.location.hash || '#all').replace('#', '').toLowerCase();
  const valid = ['all', 'aeo', 'geo', 'seo', 'local', 'ai', 'strategy'];
  if (valid.includes(initial)) {
    const target = document.querySelector('.blog-category-pill[data-filter="' + initial + '"]');
    if (target) {
      pills.forEach((p) => p.classList.remove('is-active'));
      target.classList.add('is-active');
      applyFilter(initial);
    }
  }

  // Add the empty-state element if not already present (hidden by default)
  if (!empty) {
    const grid = document.querySelector('.blog-grid');
    if (grid) {
      const div = document.createElement('div');
      div.className = 'blog-empty';
      div.style.display = 'none';
      div.textContent = 'No articles in this category yet — check back soon.';
      grid.parentNode.insertBefore(div, grid.nextSibling);
    }
  }
})();

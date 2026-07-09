/* ============================================================
   FARBER.INC — GA4 EVENT TRACKING
   Only fires events when analytics consent is granted.
   Wires up via the 'farber:consent-applied' event from cookie-consent.js
   and by re-checking localStorage on each page load.
   ============================================================ */
(function () {
  'use strict';

  function hasAnalyticsConsent() {
    try {
      var raw = localStorage.getItem('farber_cookie_consent_v1');
      if (!raw) return false;
      var c = JSON.parse(raw);
      return c && c.analytics === true;
    } catch (e) { return false; }
  }

  function track(eventName, params) {
    if (!hasAnalyticsConsent()) return;
    if (typeof gtag !== 'function') return;
    gtag('event', eventName, params || {});
  }

  function getCtaLabel(el) {
    if (!el) return null;
    return (el.getAttribute('data-cta') || el.textContent || '').trim().slice(0, 80);
  }

  // ---------- Wiring ----------
  function wireFormTracking() {
    var forms = document.querySelectorAll('form.farber-branded-form, form[action*="staticforms.dev"]');
    forms.forEach(function (form) {
      form.addEventListener('submit', function () {
        track('form_submit', {
          form_id: form.getAttribute('id') || 'contact_form',
          form_destination: form.getAttribute('action'),
          page_path: window.location.pathname
        });
      });
    });
  }

  function wireContactLinkTracking() {
    // Phone clicks
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () {
        track('phone_click', {
          link_url: a.getAttribute('href'),
          link_text: a.textContent.trim().slice(0, 80),
          page_path: window.location.pathname
        });
      });
    });
    // Email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
      a.addEventListener('click', function () {
        track('email_click', {
          link_url: a.getAttribute('href'),
          link_text: a.textContent.trim().slice(0, 80),
          page_path: window.location.pathname
        });
      });
    });
  }

  function wireCtaTracking() {
    // Primary CTA buttons — match by class or data attribute
    var ctaSelectors = [
      '.btn-primary', '.btn-gold', '.btn-secondary', '.btn-outline',
      'a[href*="#contact"]', 'a[href*="thank-you"]',
      'a.btn'
    ];
    document.querySelectorAll(ctaSelectors.join(',')).forEach(function (btn) {
      // Avoid double-firing on phone/email which already track separately
      if (btn.matches('a[href^="tel:"], a[href^="mailto:"]')) return;
      btn.addEventListener('click', function () {
        track('cta_click', {
          cta_text: getCtaLabel(btn),
          cta_href: btn.getAttribute('href'),
          cta_classes: btn.className,
          page_path: window.location.pathname
        });
      });
    });
  }

  function wireScrollDepth() {
    var milestones = [25, 50, 75, 100];
    var fired = {};
    function check() {
      var doc = document.documentElement;
      var scrollTop = window.pageYOffset || doc.scrollTop;
      var max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      var pct = Math.min(100, Math.round((scrollTop / max) * 100));
      milestones.forEach(function (m) {
        if (!fired[m] && pct >= m) {
          fired[m] = true;
          track('scroll_depth', { percent: m, page_path: window.location.pathname });
        }
      });
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () { check(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

  function wireFaqTracking() {
    document.querySelectorAll('.faq-question').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var willOpen = item && !item.classList.contains('active');
        // Wait a tick so the .active class applies first
        setTimeout(function () {
          track('faq_toggle', {
            question: (q.textContent || '').trim().slice(0, 120),
            action: willOpen ? 'open' : 'close',
            page_path: window.location.pathname
          });
        }, 50);
      });
    });
  }

  function wireServiceCardTracking() {
    document.querySelectorAll('.service-card a.btn, .card a.btn').forEach(function (a) {
      a.addEventListener('click', function () {
        var card = a.closest('.service-card, .card');
        var title = card ? card.querySelector('.card-title, h3') : null;
        track('service_card_click', {
          service_title: title ? title.textContent.trim().slice(0, 80) : null,
          link_text: a.textContent.trim().slice(0, 80),
          link_href: a.getAttribute('href'),
          page_path: window.location.pathname
        });
      });
    });
  }

  function wireNavigationTracking() {
    // Track outbound link clicks
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      a.addEventListener('click', function () {
        track('outbound_click', {
          link_url: a.getAttribute('href'),
          link_text: a.textContent.trim().slice(0, 80),
          page_path: window.location.pathname
        });
      });
    });
  }

  function wireGeoLocationCardTracking() {
    document.querySelectorAll('a.location-card').forEach(function (a) {
      a.addEventListener('click', function () {
        var cityHeading = a.querySelector('h4');
        track('geo_card_click', {
          city: cityHeading ? cityHeading.textContent.trim() : null,
          link_href: a.getAttribute('href'),
          page_path: window.location.pathname
        });
      });
    });
  }

  // ---------- Engage-time engagement ----------
  function wireEngagementTime() {
    var engaged = false;
    var startTime = Date.now();
    var milestonesSent = { 30: false, 60: false, 180: false };
    function check() {
      if (engaged) return;
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      Object.keys(milestonesSent).forEach(function (sec) {
        var s = parseInt(sec, 10);
        if (!milestonesSent[sec] && elapsed >= s) {
          milestonesSent[sec] = true;
          track('engaged_time', { seconds: s, page_path: window.location.pathname });
        }
      });
    }
    ['scroll', 'click', 'keydown'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        engaged = true;
        check();
      }, { once: false, passive: true });
    });
    // Fallback timer
    setInterval(check, 5000);
  }

  // ---------- Boot ----------
  function boot() {
    // Always wire — events no-op if consent is missing
    wireFormTracking();
    wireContactLinkTracking();
    wireCtaTracking();
    wireScrollDepth();
    wireFaqTracking();
    wireServiceCardTracking();
    wireNavigationTracking();
    wireGeoLocationCardTracking();
    wireEngagementTime();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
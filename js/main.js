/**
 * Farber.Inc Website JavaScript
 * Enterprise-grade animations and interactions
 */

// ========================================
// HEADER SCROLL EFFECT
// ========================================
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  
  lastScroll = currentScroll;
});

// ========================================
// MOBILE NAVIGATION TOGGLE
// ========================================
const mobileToggle = document.querySelector('.mobile-toggle');
const nav = document.querySelector('.nav');
const navDropdowns = document.querySelectorAll('.nav-dropdown');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    mobileToggle.classList.toggle('active');
  });
}

navDropdowns.forEach(dropdown => {
  const link = dropdown.querySelector('.nav-link');
  link.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      dropdown.classList.toggle('active');
    }
  });
});

// ========================================
// SCROLL ANIMATIONS
// ========================================
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Observe all animation elements
document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
  observer.observe(el);
});

// ========================================
// FAQ ACCORDION
// ========================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  const answerInner = item.querySelector('.faq-answer-inner') || answer;
  
  if (question && answer) {
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.style.maxHeight = '0';
        }
      });
      
      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('active');
        answer.style.maxHeight = answerInner.scrollHeight + 32 + 'px';
      }
    });
  }
});

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = header.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  });
});

// ========================================
// COUNTER ANIMATION
// ========================================
const counters = document.querySelectorAll('.stat-number[data-count]');
let countersAnimated = false;

function animateCounters() {
  if (countersAnimated) return;
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    
    updateCounter();
  });
  
  countersAnimated = true;
}

// Trigger counter animation when hero is visible
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounters();
    }
  }, { threshold: 0.5 });
  
  statsObserver.observe(heroStats);
}

// ========================================
// TESTIMONIALS SLIDER
// ========================================
class TestimonialsSlider {
  constructor(container) {
    this.container = container;
    this.slides = container.querySelectorAll('.testimonial-slide');
    this.dots = container.querySelectorAll('.slider-dot');
    this.currentIndex = 0;
    this.autoplayInterval = null;
    
    this.init();
  }
  
  init() {
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });
    
    this.startAutoplay();
    
    this.container.addEventListener('mouseenter', () => this.stopAutoplay());
    this.container.addEventListener('mouseleave', () => this.startAutoplay());
  }
  
  goToSlide(index) {
    this.slides[this.currentIndex].classList.remove('active');
    this.dots[this.currentIndex].classList.remove('active');
    
    this.currentIndex = index;
    
    this.slides[this.currentIndex].classList.add('active');
    this.dots[this.currentIndex].classList.add('active');
  }
  
  nextSlide() {
    const next = (this.currentIndex + 1) % this.slides.length;
    this.goToSlide(next);
  }
  
  startAutoplay() {
    this.autoplayInterval = setInterval(() => this.nextSlide(), 5000);
  }
  
  stopAutoplay() {
    clearInterval(this.autoplayInterval);
  }
}

const testimonialsContainer = document.querySelector('.testimonials-slider');
if (testimonialsContainer) {
  new TestimonialsSlider(testimonialsContainer);
}

// ========================================
// PRICING TOGGLE (Monthly/Annual)
// ========================================
const pricingToggle = document.querySelector('.pricing-toggle');
const pricingCards = document.querySelectorAll('.pricing-card');

if (pricingToggle) {
  pricingToggle.addEventListener('click', () => {
    pricingToggle.classList.toggle('annual');
    const isAnnual = pricingToggle.classList.contains('annual');
    
    pricingCards.forEach(card => {
      const monthlyPrice = card.querySelector('.price-monthly');
      const annualPrice = card.querySelector('.price-annual');
      
      if (monthlyPrice && annualPrice) {
        monthlyPrice.style.display = isAnnual ? 'none' : 'block';
        annualPrice.style.display = isAnnual ? 'block' : 'none';
      }
    });
  });
}

// ========================================
// FORM VALIDATION
// ========================================
const forms = document.querySelectorAll('form[data-validate]');

forms.forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    const inputs = form.querySelectorAll('[required]');
    
    inputs.forEach(input => {
      const error = input.parentElement.querySelector('.error-message');
      
      if (!input.value.trim()) {
        isValid = false;
        input.classList.add('error');
        if (error) error.style.display = 'block';
      } else {
        input.classList.remove('error');
        if (error) error.style.display = 'none';
      }
      
      // Email validation
      if (input.type === 'email' && input.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          isValid = false;
          input.classList.add('error');
          if (error) error.style.display = 'block';
        }
      }
    });
    
    if (isValid) {
      // Form is valid - submit or show success
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      // Simulate form submission
      setTimeout(() => {
        form.innerHTML = '<div class="form-success"><h3>Thank You!</h3><p>We\'ll be in touch shortly.</p></div>';
      }, 1500);
    }
  });
});

// ========================================
// LAZY LOADING IMAGES
// ========================================
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    }
  });
}, { rootMargin: '50px' });

lazyImages.forEach(img => imageObserver.observe(img));

// ========================================
// PRINT FUNCTIONALITY
// ========================================
function printDocument() {
  window.print();
}

// Make print function globally available
window.printDocument = printDocument;

// ========================================
// ANIMATED TYPING EFFECT
// ========================================
class TypeWriter {
  constructor(element, words, wait = 3000) {
    this.element = element;
    this.words = words;
    this.wait = wait;
    this.wordIndex = 0;
    this.txt = '';
    this.isDeleting = false;
    this.type();
  }
  
  type() {
    const current = this.wordIndex % this.words.length;
    const fullTxt = this.words[current];
    
    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }
    
    this.element.innerHTML = `<span class="txt">${this.txt}</span>`;
    
    let typeSpeed = 100;
    
    if (this.isDeleting) {
      typeSpeed /= 2;
    }
    
    if (!this.isDeleting && this.txt === fullTxt) {
      typeSpeed = this.wait;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.wordIndex++;
      typeSpeed = 500;
    }
    
    setTimeout(() => this.type(), typeSpeed);
  }
}

// Initialize typewriter on elements with data-typewriter
document.querySelectorAll('[data-typewriter]').forEach(el => {
  const words = JSON.parse(el.dataset.typewriter);
  new TypeWriter(el, words);
});

// ========================================
// PARALLAX EFFECT
// ========================================
const parallaxElements = document.querySelectorAll('[data-parallax]');

window.addEventListener('scroll', () => {
  parallaxElements.forEach(el => {
    const speed = el.dataset.parallax || 0.5;
    const yPos = -(window.pageYOffset * speed);
    el.style.transform = `translateY(${yPos}px)`;
  });
});

// ========================================
// SCROLL PROGRESS INDICATOR
// ========================================
const progressBar = document.querySelector('.scroll-progress');

if (progressBar) {
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = `${progress}%`;
  });
}

// ========================================
// DYNAMIC YEAR IN FOOTER
// ========================================
const yearElements = document.querySelectorAll('.current-year');
yearElements.forEach(el => {
  el.textContent = new Date().getFullYear();
});

// ========================================
// PRELOADER
// ========================================
window.addEventListener('load', () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.classList.add('loaded');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
});

// ========================================
// TABS FUNCTIONALITY
// ========================================
const tabContainers = document.querySelectorAll('.tabs-container');

tabContainers.forEach(container => {
  const tabs = container.querySelectorAll('.tab-btn');
  const panels = container.querySelectorAll('.tab-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      container.querySelector(`#${target}`).classList.add('active');
    });
  });
});

// ========================================
// BACK TO TOP BUTTON
// ========================================
const backToTop = document.querySelector('.back-to-top');

if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ========================================
// PHONE NUMBER FORMATTING
// ========================================
const phoneInputs = document.querySelectorAll('input[type="tel"]');

phoneInputs.forEach(input => {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 6) {
      value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0,3)}) ${value.slice(3)}`;
    }
    
    e.target.value = value;
  });
});

// ========================================
// COOKIE CONSENT (if needed)
// ========================================
const cookieConsent = document.querySelector('.cookie-consent');
const acceptBtn = cookieConsent?.querySelector('.accept-cookies');

if (cookieConsent && !localStorage.getItem('cookiesAccepted')) {
  cookieConsent.style.display = 'block';
  
  acceptBtn?.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    cookieConsent.style.display = 'none';
  });
}

console.log('Farber.Inc - Website Initialized');
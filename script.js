/* ==========================================================================
   ShopifyNexa — main.js
   Lenis smooth scroll + GSAP reveals/parallax + Swiper + micro-interactions
   ========================================================================== */
(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------------------------------------------------------------------
     1. Lenis smooth scroll
  --------------------------------------------------------------------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.1
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* Smooth in-page anchor scrolling */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -70, duration: 1.3 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      closeMenu();
    });
  });

  /* ---------------------------------------------------------------------
     2. GSAP setup
  --------------------------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    /* Hero load-in sequence */
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .to('.hero-top .eyebrow', { opacity: 1, y: 0, duration: .7 }, .1)
      .to('.hero-top h1', { opacity: 1, y: 0, duration: .9 }, .2)
      .to('.hero-top p', { opacity: 1, y: 0, duration: .8 }, .38)
      .to('.hero-buttons', { opacity: 1, y: 0, duration: .8 }, .5)
      .to('.hero-stage', { opacity: 1, y: 0, duration: 1.1 }, .55)
      .fromTo('.float-card-1', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: .8 }, .9)
      .fromTo('.float-card-2', { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .8 }, 1);

    gsap.set(['.hero-top .eyebrow', '.hero-top h1', '.hero-top p', '.hero-buttons', '.hero-stage'], { y: 24 });

    /* Generic reveal-on-scroll for anything with .reveal not in hero */
    document.querySelectorAll('.reveal').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.fromTo(el, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* Stagger children of grids */
    [
      ['.services-grid', '.service-card'],
      ['.portfolio-grid', '.portfolio-card'],
      ['.results-grid', '.result-card'],
      ['.process-row', '.process-step']
    ].forEach(function (pair) {
      var parent = document.querySelector(pair[0]);
      if (!parent) return;
      var items = parent.querySelectorAll(pair[1]);
      gsap.fromTo(items, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: .8, stagger: .1, ease: 'power3.out',
        scrollTrigger: { trigger: parent, start: 'top 85%' }
      });
    });

    var problemRows = document.querySelectorAll('.problem-row');
    if (problemRows.length) {
      gsap.fromTo(problemRows, { opacity: 0, x: -20 }, {
        opacity: 1, x: 0, duration: .7, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: '.problem-list', start: 'top 85%' }
      });
    }

    /* Metric bars fill */
    document.querySelectorAll('.metric-fill').forEach(function (bar) {
      var pct = bar.getAttribute('data-fill') || 0;
      ScrollTrigger.create({
        trigger: bar,
        start: 'top 90%',
        once: true,
        onEnter: function () { bar.style.width = pct + '%'; }
      });
    });

    /* Nav background on scroll */
    ScrollTrigger.create({
      start: 'top -60',
      end: 99999,
      toggleClass: { targets: '#nav', className: 'scrolled' }
    });

    /* Hero parallax on scroll (subtle) */
    if (!isTouch) {
      gsap.to('.hero-grid-bg', {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.mock-window', {
        y: -30,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  } else {
    /* Fallback: no GSAP — just show reveal elements */
    document.querySelectorAll('.reveal').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------------------------------------------------------------------
     3. Hero mock-window tilt (mouse parallax) — signature interaction
  --------------------------------------------------------------------- */
  var stage = document.getElementById('heroStage');
  var mockWindow = document.getElementById('mockWindow');
  var fc1 = document.getElementById('floatCard1');
  var fc2 = document.getElementById('floatCard2');
  if (stage && mockWindow && !isTouch && !reduceMotion) {
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      if (window.gsap) {
        gsap.to(mockWindow, { rotateX: 6 - py * 8, rotateY: px * 10, duration: .6, ease: 'power2.out' });
        gsap.to(fc1, { x: px * -14, y: py * -10, duration: .8, ease: 'power2.out' });
        gsap.to(fc2, { x: px * 14, y: py * 10, duration: .8, ease: 'power2.out' });
      }
    });
    stage.addEventListener('mouseleave', function () {
      if (window.gsap) {
        gsap.to(mockWindow, { rotateX: 6, rotateY: 0, duration: .8, ease: 'power3.out' });
        gsap.to([fc1, fc2], { x: 0, y: 0, duration: .8, ease: 'power3.out' });
      }
    });
  }

  /* Idle float animation for cards */
  if (window.gsap && !reduceMotion) {
    gsap.to('.float-card-1', { y: '+=10', duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.float-card-2', { y: '-=10', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: .4 });
  }

  /* ---------------------------------------------------------------------
     4. Animated counters
  --------------------------------------------------------------------- */
  document.querySelectorAll('.counter').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var started = false;
    function run() {
      if (started) return;
      started = true;
      var obj = { val: 0 };
      if (window.gsap) {
        gsap.to(obj, {
          val: target, duration: 1.6, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(obj.val); }
        });
      } else {
        el.textContent = target;
      }
    }
    if (window.ScrollTrigger) {
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: run });
    } else {
      run();
    }
  });

  /* ---------------------------------------------------------------------
     5. Custom cursor
  --------------------------------------------------------------------- */
  var cursorDot = document.getElementById('cursorDot');
  var cursorRing = document.getElementById('cursorRing');
  if (cursorDot && cursorRing && !isTouch) {
    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function loop() {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      cursorRing.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button, [data-magnetic]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorRing.style.width = '52px';
        cursorRing.style.height = '52px';
        cursorRing.style.background = 'rgba(255,255,255,.08)';
      });
      el.addEventListener('mouseleave', function () {
        cursorRing.style.width = '34px';
        cursorRing.style.height = '34px';
        cursorRing.style.background = 'transparent';
      });
    });
  }

  /* ---------------------------------------------------------------------
     6. Magnetic buttons
  --------------------------------------------------------------------- */
  if (!isTouch && window.gsap) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * 0.28, y: y * 0.5, duration: .4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  /* ---------------------------------------------------------------------
     7. Mobile menu
  --------------------------------------------------------------------- */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('active');
      hamburger.classList.toggle('active', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------------------------------------------------------------------
     8. FAQ accordion
  --------------------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var wrap = item.querySelector('.faq-a-wrap');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a-wrap').style.height = '0px';
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        wrap.style.height = '0px';
      } else {
        item.classList.add('open');
        wrap.style.height = wrap.scrollHeight + 'px';
      }
    });
  });

  /* ---------------------------------------------------------------------
     9. Swiper testimonials
  --------------------------------------------------------------------- */
  if (window.Swiper) {
    new Swiper('.testi-swiper', {
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      speed: 700,
      slidesPerView: 1,
      spaceBetween: 24,
      pagination: { el: '.swiper-pagination', clickable: true },
      breakpoints: {
        860: { slidesPerView: 2.15 }
      }
    });
  }

  /* ---------------------------------------------------------------------
     10. Contact form (client-side demo submit)
  --------------------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  var submitBtn = document.getElementById('submitBtn');
  var submitLabel = document.getElementById('submitLabel');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';
      setTimeout(function () {
        form.style.display = 'none';
        success.classList.add('show');
      }, 900);
    });
  }

})();


   const customShowcaseSwiper = new Swiper(".custom-showcase-slider", {
      slidesPerView: "auto",
      spaceBetween: 14,

      loop: true,
      loopAdditionalSlides: 6,

      speed: 1300,

      grabCursor: true,

      allowTouchMove: true,

      watchSlidesProgress: true,

      observer: true,
      observeParents: true,

      autoplay: {
        delay: 2200,
        disableOnInteraction: false,
        pauseOnMouseEnter: false
      },

      breakpoints: {
        0: {
          spaceBetween: 10
        },

        768: {
          spaceBetween: 14
        },

        1200: {
          spaceBetween: 14
        }
      }
    });
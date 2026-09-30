/* ==========================================================================
   ShopifyNexa — Animation Engine
   Lenis + GSAP + ScrollTrigger + Theme Toggle + Custom Cursor + Exit Intent
   ========================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ==================================================================
     1. THEME TOGGLE
  ================================================================== */
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("nexa-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("nexa-theme", next);
    });
  }

  /* ==================================================================
     2. GSAP SETUP
  ================================================================== */
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    if (window.CustomEase) {
      gsap.registerPlugin(CustomEase);
      CustomEase.create("nexa", "0.16, 1, 0.3, 1");
    }
  }
  const EASE = window.CustomEase ? "nexa" : "power3.out";

  /* ==================================================================
     3. LENIS SMOOTH SCROLL (fixed jitter version)
  ================================================================== */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      autoRaf: false,
    });

    if (window.gsap && window.ScrollTrigger) {
      // Single source of truth: gsap.ticker drives Lenis
      gsap.ticker.lagSmoothing(0);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
    } else {
      // Fallback: standalone RAF
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  /* Anchor links */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.6 });
      else if (window.gsap) gsap.to(window, { duration: 1.2, scrollTo: { y: target, offsetY: 70 }, ease: "power3.inOut" });
      else target.scrollIntoView({ behavior: "smooth" });
      closeMenu();
    });
  });

  /* ==================================================================
     4. HERO / CTA TITLE — mask set
  ================================================================== */
  if (window.gsap) {
    const heroLineInners = document.querySelectorAll(".hero-title .line-inner");
    if (heroLineInners.length) gsap.set(heroLineInners, { yPercent: 110 });

    const ctaLineInners = document.querySelectorAll(".cta-title .line-inner");
    if (ctaLineInners.length) gsap.set(ctaLineInners, { yPercent: 110 });
  }

  /* ==================================================================
     5. PRELOADER + ENTRANCE
  ================================================================== */
  const preloader = document.getElementById("preloader");
  const bar = document.querySelector(".preloader-bar span");

  function runEntrance() {
    if (!window.gsap) {
      if (preloader) preloader.style.display = "none";
      document.querySelectorAll(".reveal").forEach((el) => (el.style.opacity = 1));
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        if (preloader) preloader.style.display = "none";
        document.body.style.overflow = "";
        ScrollTrigger.refresh();
      },
    });

    if (preloader && bar) {
      tl.to(bar, { width: "100%", duration: 0.7, ease: "power2.inOut" })
        .to(preloader, { yPercent: -100, duration: 1, ease: "power4.inOut" }, "+=0.1");
    }

    tl.add(() => {
      const heroTl = gsap.timeline({ defaults: { ease: EASE } });
      heroTl
        .to(".hero-title .line-inner", { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0)
        .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 1 }, 0.3)
        .to(".hero-sub", { opacity: 1, y: 0, duration: 1 }, 0.7)
        .to(".hero-actions", { opacity: 1, y: 0, duration: 1 }, 0.85)
        .to(".hero-meta", { opacity: 1, y: 0, duration: 1 }, 1);
    });
  }

  if (preloader) {
    document.body.style.overflow = "hidden";

    if (window.gsap) {
      gsap.set(".hero-eyebrow", { opacity: 0, y: 30 });
      gsap.set(".hero-sub", { opacity: 0, y: 30 });
      gsap.set(".hero-actions", { opacity: 0, y: 30 });
      gsap.set(".hero-meta", { opacity: 0, y: 30 });
    }

    if (document.readyState === "complete") runEntrance();
    else window.addEventListener("load", runEntrance);
  } else {
    runEntrance();
  }

  /* ==================================================================
     6. SCROLL ANIMATIONS
  ================================================================== */
  function initScrollAnimations() {
    if (!window.gsap || !window.ScrollTrigger) {
      document.querySelectorAll(".reveal").forEach((el) => (el.style.opacity = 1));
      return;
    }

    // Generic reveals
    document.querySelectorAll(".reveal").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 1.1, ease: EASE,
          scrollTrigger: { trigger: el, start: "top 88%" },
        }
      );
    });

    // CTA title lines
    if (document.querySelector(".cta-title")) {
      gsap.to(".cta-title .line-inner", {
        yPercent: 0, duration: 1.3, stagger: 0.1, ease: EASE,
        scrollTrigger: { trigger: ".cta", start: "top 75%" },
      });
    }

    // Counters
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () =>
          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => (el.textContent = prefix + Math.round(obj.val) + suffix),
          }),
      });
    });

    // Metric bars
    document.querySelectorAll(".metric-bar span").forEach((bar) => {
      const pct = bar.dataset.fill || 0;
      ScrollTrigger.create({
        trigger: bar,
        start: "top 90%",
        once: true,
        onEnter: () => gsap.to(bar, { width: pct + "%", duration: 1.6, ease: "power3.out" }),
      });
    });

    // Bento stagger
    gsap.utils.toArray(".bento-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 1, delay: (i % 3) * 0.08, ease: EASE,
          scrollTrigger: { trigger: card, start: "top 92%" },
        }
      );
    });

    // Problem cards
    gsap.utils.toArray(".problem-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, x: 40 },
        {
          opacity: 1, x: 0, duration: 1, delay: i * 0.08, ease: EASE,
          scrollTrigger: { trigger: card, start: "top 90%" },
        }
      );
    });

    // Process steps
    gsap.utils.toArray(".process-step").forEach((step, i) => {
      gsap.fromTo(
        step,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, delay: i * 0.1, ease: EASE,
          scrollTrigger: { trigger: step, start: "top 90%" },
        }
      );
    });

    // Results
    gsap.utils.toArray(".result").forEach((r, i) => {
      gsap.fromTo(
        r,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 1, delay: i * 0.12, ease: EASE,
          scrollTrigger: { trigger: r, start: "top 90%" },
        }
      );
    });

    // Nav scroll state
    const navEl = document.getElementById("nav");
    ScrollTrigger.create({
      start: "top -60",
      end: 99999,
      onUpdate: (self) => {
        if (navEl) navEl.classList.toggle("scrolled", self.scroll() > 60);
      },
    });

    // Hide-on-scroll-down nav (debounced to prevent jitter)
    let lastY = 0;
    let navTimer = null;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (!navEl) return;
        const y = self.scroll();
        if (Math.abs(y - lastY) < 6) return;
        clearTimeout(navTimer);
        navTimer = setTimeout(() => {
          if (y > 220 && y > lastY) navEl.classList.add("hide");
          else navEl.classList.remove("hide");
        }, 30);
        lastY = y;
      },
    });

    // Scroll progress
    const progress = document.getElementById("scrollProgress");
    if (progress) {
      gsap.to(progress, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
    }

    // Portfolio horizontal scroll (desktop only)
    if (!isTouch && window.innerWidth > 900) {
      const track = document.getElementById("portfolioTrack");
      const section = document.querySelector(".portfolio-h");
      if (track && section) {
        const totalScroll = track.scrollWidth - window.innerWidth + 100;
        gsap.to(track, {
          x: -totalScroll,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + totalScroll,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }
    }

    // CTA glow parallax
    gsap.to(".cta-glow", {
      yPercent: -30, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
    });

    // Hero orbs parallax
    gsap.to(".hero-orb-1", {
      yPercent: 30, xPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero-orb-2", {
      yPercent: -30, xPercent: -10, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  if (window.gsap && window.ScrollTrigger) {
    const initWhenReady = () => {
      initScrollAnimations();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
      setTimeout(() => ScrollTrigger.refresh(), 500);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWhenReady);
    } else {
      initWhenReady();
    }
  } else {
    initScrollAnimations();
  }

  /* ==================================================================
     7. CUSTOM CURSOR
  ================================================================== */
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (dot && ring && !isTouch) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    });
    (function loop() {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll("a, button, [data-magnetic], .pf-card, .bento-card, .problem-card").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.style.width = "56px";
        ring.style.height = "56px";
        ring.style.background = "rgba(34,197,94,.15)";
      });
      el.addEventListener("mouseleave", () => {
        ring.style.width = "34px";
        ring.style.height = "34px";
        ring.style.background = "transparent";
      });
    });
  }

  /* ==================================================================
     8. MAGNETIC BUTTONS
  ================================================================== */
  if (!isTouch && window.gsap) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * 0.25, y: y * 0.4, duration: 0.4, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ==================================================================
     9. MOBILE MENU
  ================================================================== */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("active");
    if (hamburger) hamburger.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("active");
      hamburger.classList.toggle("active", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ==================================================================
     10. FAQ ACCORDION
  ================================================================== */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((other) => {
        if (other !== item) {
          other.classList.remove("open");
          other.querySelector(".faq-a").style.height = "0px";
        }
      });
      if (isOpen) {
        item.classList.remove("open");
        a.style.height = "0px";
      } else {
        item.classList.add("open");
        a.style.height = a.scrollHeight + "px";
      }
    });
  });

  /* ==================================================================
     11. CONTACT FORM
  ================================================================== */
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = document.getElementById("submitLabel");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      submitBtn.disabled = true;
      submitLabel.textContent = "Sending…";
      setTimeout(() => {
        form.style.display = "none";
        success.classList.add("show");
      }, 900);
    });
  }

  document.querySelectorAll(".field select").forEach((sel) => {
    const update = () => sel.parentElement.classList.toggle("filled", sel.value !== "");
    sel.addEventListener("change", update);
    update();
  });

  /* ==================================================================
     12. EXIT INTENT POPUP
  ================================================================== */
  const exitPopup = document.getElementById("exitPopup");
  const exitForm = document.getElementById("exitForm");
  const exitSuccess = document.getElementById("exitSuccess");
  const exitBtnLabel = document.getElementById("exitBtnLabel");

  if (exitPopup) {
    let shown = sessionStorage.getItem("nexa-exit-shown");
    let armed = false;

    setTimeout(() => { armed = true; }, 8000);

    function showExit() {
      if (shown || !armed) return;
      exitPopup.classList.add("show");
      exitPopup.setAttribute("aria-hidden", "false");
      sessionStorage.setItem("nexa-exit-shown", "1");
    }
    function hideExit() {
      exitPopup.classList.remove("show");
      exitPopup.setAttribute("aria-hidden", "true");
    }

    document.addEventListener("mouseleave", (e) => {
      if (e.clientY <= 0) showExit();
    });

    let lastScrollY = 0;
    let scrollUpStart = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < lastScrollY) {
        if (!scrollUpStart) scrollUpStart = y;
        if (scrollUpStart - y > 500 && y < 800) showExit();
      } else {
        scrollUpStart = 0;
      }
      lastScrollY = y;
    }, { passive: true });

    exitPopup.querySelectorAll("[data-exit-close]").forEach((el) => {
      el.addEventListener("click", hideExit);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideExit();
    });

    if (exitForm) {
      exitForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("exitEmail").value;
        if (!email) return;
        exitBtnLabel.textContent = "Sending…";
        setTimeout(() => {
          exitForm.style.display = "none";
          exitSuccess.classList.add("show");
          setTimeout(hideExit, 2400);
        }, 700);
      });
    }
  }

  /* ==================================================================
     13. RESIZE REFRESH
  ================================================================== */
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 200);
  });
})();
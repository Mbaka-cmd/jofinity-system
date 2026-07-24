/* Jofinitycore Systems - Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {

  // === HERO SLIDESHOW ===
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dot');
  const heroPrev = document.querySelector('.hero-arrow-prev');
  const heroNext = document.querySelector('.hero-arrow-next');

  if (heroSlides.length) {
    let currentSlide = 0;
    let slideTimer = null;

    function goToSlide(index) {
      heroSlides[currentSlide].classList.remove('active');
      if (heroDots[currentSlide]) heroDots[currentSlide].classList.remove('active');
      currentSlide = (index + heroSlides.length) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
      if (heroDots[currentSlide]) heroDots[currentSlide].classList.add('active');
    }

    function startSlideTimer() {
      slideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
    }

    function resetSlideTimer() {
      clearInterval(slideTimer);
      startSlideTimer();
    }

    heroDots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goToSlide(i); resetSlideTimer(); });
    });
    if (heroPrev) heroPrev.addEventListener('click', () => { goToSlide(currentSlide - 1); resetSlideTimer(); });
    if (heroNext) heroNext.addEventListener('click', () => { goToSlide(currentSlide + 1); resetSlideTimer(); });

    startSlideTimer();
  }

  // === NAVBAR SCROLL BEHAVIOR ===
  const navbar = document.getElementById('navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Mobile nav toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active nav link â€” works for both /page routes and page.html file paths
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const hrefFile = href.split('/').pop() || 'index.html';
    const isHome = (currentFile === '' || currentFile === 'index.html') && (href === 'index.html' || href === '/' || href === '');
    if (isHome || (hrefFile && hrefFile !== 'index.html' && currentFile === hrefFile)) {
      link.classList.add('active');
    }
  });

  // === ANIMATE ON SCROLL ===
  const aosElements = document.querySelectorAll('.aos');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    aosElements.forEach(el => observer.observe(el));
  } else {
    aosElements.forEach(el => el.classList.add('visible'));
  }

  // === BACK TO TOP ===
  const btt = document.querySelector('.btt');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // === COUNTER ANIMATION ===
  function animateCounter(el, target, suffix = '') {
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const val = parseInt(el.dataset.counter);
          const suffix = el.dataset.suffix || '';
          animateCounter(el, val, suffix);
          counterObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObs.observe(el));
  }

  // === CONTACT FORM ===
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const formMsg = document.getElementById('formMsg');
    const submitBtn = contactForm.querySelector('.form-submit-btn');
    
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formMsg.className = 'form-response';
      formMsg.style.display = 'none';
      
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      const formData = {
        name: contactForm.name.value,
        email: contactForm.email.value,
        phone: contactForm.phone.value,
        service: contactForm.service.value,
        message: contactForm.message.value
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if (data.success) {
          formMsg.textContent = data.message;
          formMsg.className = 'form-response success';
          contactForm.reset();
        } else {
          const msg = data.errors ? data.errors.map(e => e.msg).join('. ') : data.message;
          formMsg.textContent = msg || 'Something went wrong. Please try again.';
          formMsg.className = 'form-response error';
        }
      } catch (err) {
        formMsg.textContent = 'Network error. Please call us directly: +254 700 670 408';
        formMsg.className = 'form-response error';
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        formMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // === PROJECT FILTER ===
  const filterBtns = document.querySelectorAll('.fbtn');
  const projectCards = document.querySelectorAll('.pcard');
  
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        projectCards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = '';
            setTimeout(() => card.classList.add('visible'), 10);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

});


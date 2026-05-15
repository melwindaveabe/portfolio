/* -----------------------------------------
  Focus outline only for keyboard users
 ---------------------------------------- */

const handleFirstTab = (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDownOnce);
  }
};

const handleMouseDownOnce = () => {
  document.body.classList.remove('user-is-tabbing');
  window.removeEventListener('mousedown', handleMouseDownOnce);
  window.addEventListener('keydown', handleFirstTab);
};

window.addEventListener('keydown', handleFirstTab);

/* -----------------------------------------
  Back to top button
 ---------------------------------------- */

const backToTopButton = document.querySelector('.back-to-top');
let isBackToTopRendered = false;

const alterStyles = (visible) => {
  backToTopButton.style.visibility = visible ? 'visible' : 'hidden';
  backToTopButton.style.opacity    = visible ? 1 : 0;
  backToTopButton.style.transform  = visible ? 'scale(1)' : 'scale(0)';
};

window.addEventListener('scroll', () => {
  const visible = window.scrollY > 700;
  if (visible !== isBackToTopRendered) {
    isBackToTopRendered = visible;
    alterStyles(visible);
  }
});

/* -----------------------------------------
  Contact form handler (Formspree)
 ---------------------------------------- */

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('.contact__submit');

  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });

    if (response.ok) {
      btn.textContent = 'Sent ✓';
      btn.style.background = '#1a8a4a';
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    } else {
      const data = await response.json();
      const msg = data.errors
        ? data.errors.map(err => err.message).join(', ')
        : 'Something went wrong.';
      throw new Error(msg);
    }
  } catch (err) {
    btn.textContent = 'Try Again';
    btn.style.background = '#c0392b';
    btn.disabled = false;
    alert('Error: ' + err.message);
  }
}

/* -----------------------------------------
  Scroll fade-in animation
 ---------------------------------------- */

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings slightly for a cascade effect
      const siblings = entry.target.parentElement.querySelectorAll('.fade-in');
      let delay = 0;
      siblings.forEach((el, idx) => {
        if (el === entry.target) delay = idx * 120;
      });
      setTimeout(() => entry.target.classList.add('visible'), delay);
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

/* -----------------------------------------
  Animated stat counters
 ---------------------------------------- */

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;

  const tick = () => {
    current += step;
    if (current >= target) {
      el.textContent = target;
    } else {
      el.textContent = Math.floor(current);
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.about__stat-num[data-target]').forEach(animateCounter);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const aboutContent = document.querySelector('.about__content');
if (aboutContent) statsObserver.observe(aboutContent);

/* -----------------------------------------
  Footer year
 ---------------------------------------- */

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* -----------------------------------------
  Matrix binary rain — header only
 ---------------------------------------- */

(function () {
  const canvas = document.getElementById('matrix-canvas');
  const ctx    = canvas.getContext('2d');
  const chars  = ['0', '1'];
  const fontSize = 16;
  let columns, drops;

  function init() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops   = Array.from({ length: columns }, () => Math.random() * -100);
  }

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const bit = chars[Math.floor(Math.random() * 2)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      ctx.fillStyle = (y > 0 && Math.random() > 0.95) ? '#ffffff' : '#00ff41';
      ctx.fillText(bit, x, y);

      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.5;
    }
  }

  init();
  setInterval(draw, 33);
  window.addEventListener('resize', init);
})();

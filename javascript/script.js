// Image protection
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const header = document.querySelector('.header');

function syncHeaderOffset() {
  if (!header) return;
  document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
}
syncHeaderOffset();
window.addEventListener('load', syncHeaderOffset);
window.addEventListener('resize', syncHeaderOffset);

function closeNav() {
  navMenu?.classList.remove('open');
  navOverlay?.classList.remove('visible');
  navToggle?.classList.remove('active');
  navToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeNav();
  });
});

// Footer date/time
const footerDateTime = document.getElementById('footerDateTime');
function updateDateTime() {
  if (!footerDateTime) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.toLocaleString('default', { month: 'short' });
  const d = now.getDate().toString().padStart(2, '0');
  const h = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  footerDateTime.textContent = `${y} | ${m} ${d} | ${h}:${min}`;
}
updateDateTime();
setInterval(updateDateTime, 60000);

// Theme
const themeToggle = document.getElementById('themeToggle');
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
setTheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle?.addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

// Mobile menu
navToggle?.addEventListener('click', () => {
  const isOpen = navMenu?.classList.toggle('open');
  navOverlay?.classList.toggle('visible', isOpen);
  navToggle?.classList.toggle('active', isOpen);
  navToggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
navOverlay?.addEventListener('click', closeNav);

// Back to top
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => backToTop?.classList.toggle('visible', window.scrollY > 300));
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// === GSAP Animations ===
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // Hero stagger - animates from hidden to visible
  gsap.from('[data-animate]', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.1,
    clearProps: "all"
  });
}

// === Focus bars: mouse-follow interactivity ===
const focusVisual = document.getElementById('focusVisual');
const bars = document.querySelectorAll('.pulse-bars .bar');

if (focusVisual && bars.length && !prefersReducedMotion) {
  focusVisual.addEventListener('mousemove', (e) => {
    const rect = focusVisual.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    bars.forEach((bar, i) => {
      const barCenter = (i + 0.5) / bars.length;
      const influence = Math.max(0, 1 - Math.abs(x - barCenter) * 2.5);
      bar.style.transform = `scaleY(${1 + influence * 0.35})`;
    });
  });
  focusVisual.addEventListener('mouseleave', () => {
    bars.forEach((b) => (b.style.transform = ''));
  });
}

// === Image hover parallax (mouse follow) ===
const heroImage = document.getElementById('heroImage');
const heroFrame = document.querySelector('.hero-image-frame');

if (heroImage && heroFrame && !prefersReducedMotion) {
  heroFrame.addEventListener('mousemove', (e) => {
    const rect = heroFrame.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    gsap?.to(heroImage, {
      x: x * 8,
      y: y * 8,
      scale: 1.03,
      duration: 0.4,
      ease: 'power2.out'
    });
  });

  heroFrame.addEventListener('mouseleave', () => {
    gsap?.to(heroImage, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power2.out'
    });
  });

  // Focus section scroll reveal
  gsap.from('.focus-heading, .focus-hint', {
    scrollTrigger: {
      trigger: '.focus',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power3.out'
  });

  gsap.from('.pulse-bars .bar', {
    scrollTrigger: {
      trigger: '.focus-visual',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    },
    scaleY: 0,
    duration: 0.6,
    stagger: 0.04,
    ease: 'back.out(1.4)'
  });
}

// === Music Melody Cursor & Click Animation ===
const musicalNotes = ['\u2669', '\u266A', '\u266B', '\u266C']; // ♩, ♪, ♫, ♬

// Custom Cursor
const cursor = document.createElement('div');
cursor.className = 'music-cursor';
cursor.style.cssText = `
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  font-size: 24px;
  opacity: 0;
  transition: opacity 0.3s ease;
  user-select: none;
`;
cursor.textContent = '\u266B';
document.body.appendChild(cursor);

let cursorUpdatePending = false;
document.addEventListener('mousemove', (e) => {
  if (!cursorUpdatePending) {
    requestAnimationFrame(() => {
      cursor.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 10}px)`;
      cursor.style.opacity = '1';
      cursorUpdatePending = false;
    });
    cursorUpdatePending = true;
  }
});

// Click Melody Animation
document.addEventListener('click', (e) => {
  const isButton = e.target.closest('button, a, .btn-primary');

  // Always spawn a few notes, maybe more for buttons
  const noteCount = isButton ? 6 : 2;

  for (let i = 0; i < noteCount; i++) {
    const note = document.createElement('div');
    note.className = 'note-particle';
    note.textContent = musicalNotes[Math.floor(Math.random() * musicalNotes.length)];
    note.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      pointer-events: none;
      z-index: 9998;
      font-size: ${16 + Math.random() * 12}px;
      user-select: none;
    `;
    document.body.appendChild(note);

    gsap.to(note, {
      x: (Math.random() - 0.5) * 150,
      y: -100 - Math.random() * 100,
      rotation: (Math.random() - 0.5) * 90,
      opacity: 0,
      duration: 1 + Math.random(),
      ease: 'power1.out',
      onComplete: () => note.remove()
    });
  }
});

// Image protection
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const header = document.querySelector('.header');
const preloader = document.getElementById('site-preloader');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let smoothScrollRaf = null;
let preloaderDone = false;
const preloadStartedAt = window.__siteLoadStart || performance.now();

function finishPreload() {
  if (preloaderDone) return;
  preloaderDone = true;
  document.documentElement.classList.remove('is-loading');
  preloader?.setAttribute('aria-hidden', 'true');
}

function hidePreloader() {
  const minVisibleMs = 1100;
  const elapsed = performance.now() - preloadStartedAt;
  const delay = Math.max(0, minVisibleMs - elapsed);
  window.setTimeout(finishPreload, delay);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') hidePreloader();
document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
window.addEventListener('load', hidePreloader, { once: true });
window.addEventListener('pageshow', hidePreloader, { once: true });
window.setTimeout(finishPreload, 6000);

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

function smoothScrollToY(targetY, duration = 650) {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const finalY = Math.min(Math.max(targetY, 0), maxScroll);

  if (prefersReducedMotion) {
    window.scrollTo(0, finalY);
    return;
  }

  if (smoothScrollRaf) cancelAnimationFrame(smoothScrollRaf);

  const startY = window.scrollY;
  const distance = finalY - startY;
  if (Math.abs(distance) < 1) {
    window.scrollTo(0, finalY);
    return;
  }

  const startTime = performance.now();
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) {
      smoothScrollRaf = requestAnimationFrame(step);
    } else {
      smoothScrollRaf = null;
    }
  };

  smoothScrollRaf = requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const headerOffset = header?.offsetHeight || 0;
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    smoothScrollToY(targetY);
    if (history.replaceState) history.replaceState(null, '', href);
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
backToTop?.addEventListener('click', () => smoothScrollToY(0));

// === GSAP Animations ===
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

// Music cursor + note burst for interactive elements
const supportsHoverCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const interactiveSelector = 'a, button, .btn-primary';

function spawnNoteBurst(x, y, count = 6) {
  const notes = ['\u2669', '\u266A', '\u266B', '\u266C'];
  for (let i = 0; i < count; i += 1) {
    const note = document.createElement('span');
    note.className = 'note-particle';
    note.textContent = notes[Math.floor(Math.random() * notes.length)];
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    note.style.setProperty('--x', `${(Math.random() - 0.5) * 140}px`);
    note.style.setProperty('--y', `${-50 - Math.random() * 110}px`);
    note.style.setProperty('--r', `${(Math.random() - 0.5) * 70}deg`);
    document.body.appendChild(note);
    note.addEventListener('animationend', () => note.remove(), { once: true });
  }
}

if (supportsHoverCursor) {
  const musicCursor = document.createElement('div');
  musicCursor.className = 'music-cursor';
  musicCursor.innerHTML = '<i class="ri-music-2-fill" aria-hidden="true"></i>';
  document.body.appendChild(musicCursor);
  let hoverInteractive = null;

  const setInteractiveHover = (target) => {
    if (hoverInteractive === target) return;
    if (hoverInteractive) hoverInteractive.classList.remove('music-hover-target');
    hoverInteractive = target;
    if (hoverInteractive) {
      hoverInteractive.classList.add('music-hover-target');
      musicCursor.classList.add('visible');
    } else {
      musicCursor.classList.remove('visible');
    }
  };

  document.addEventListener('pointermove', (e) => {
    musicCursor.style.left = `${e.clientX + 14}px`;
    musicCursor.style.top = `${e.clientY + 12}px`;
  });

  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest(interactiveSelector);
    if (target) setInteractiveHover(target);
  });

  document.addEventListener('pointerout', (e) => {
    if (!hoverInteractive) return;
    const next = e.relatedTarget;
    if (next && hoverInteractive.contains(next)) return;
    const nextInteractive = next?.closest?.(interactiveSelector) || null;
    setInteractiveHover(nextInteractive);
  });
}

document.addEventListener('click', (e) => {
  const target = e.target.closest(interactiveSelector);
  if (!target) return;
  const x = e.clientX || window.innerWidth / 2;
  const y = e.clientY || window.innerHeight / 2;
  spawnNoteBurst(x, y, 6);
});

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
let startDecodeSequence = null; // To be populated later
const startBtn = document.getElementById('startBtn');

function finishPreload() {
  if (preloaderDone) return;
  preloaderDone = true;
  document.documentElement.classList.remove('is-loading');

  if (preloader) {
    const rect = startBtn ? startBtn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Massive Music Wipe Transition
    if (typeof spawnNoteBurst === 'function') {
      spawnNoteBurst(x, y, 25);
    }
    
    preloader.classList.add('is-hidden');
  }

  // Cinematic Timing: Delay entrance animations
  if (window.startDecodeSequence) {
    setTimeout(window.startDecodeSequence, 500);
  }
}
window.finishPreload = finishPreload;

if (startBtn) {
  startBtn.addEventListener('click', finishPreload);
} else {
  // Safe fallback if button doesn't exist
  window.addEventListener('load', finishPreload);
  window.setTimeout(finishPreload, 6000);
}

function clearMainHashFromUrl() {
  if (window.location.hash !== '#main' || !history.replaceState) return;
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
clearMainHashFromUrl();
window.addEventListener('hashchange', clearMainHashFromUrl);

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

// === GSAP Animations & Creative Interactions ===
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // These will be triggered from finishPreload() when the START button is clicked
  window.startDecodeSequence = () => {
    // 1. Prepare Hero Title for Musical Stagger (Letter-by-letter)
    const title = document.querySelector('.hero-title');
    if (title) {
        const text = title.innerHTML;
        // Don't split if already split
        if (!title.querySelector('.char-reveal')) {
            const html = text.replace(/([^\s<br>])/g, "<span class='char-reveal' style='display:inline-block; opacity:0; transform:translateY(30px)'>$1</span>");
            title.innerHTML = html;
        }
        
        gsap.to(title.querySelectorAll('.char-reveal'), {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: 'back.out(1.7)',
            onStart: () => {
                // Occassional notes from title as it reveals
                gsap.delayedCall(0.1, () => {
                   const rect = title.getBoundingClientRect();
                   if (typeof spawnNoteBurst === 'function') spawnNoteBurst(rect.left + 50, rect.top + 20, 3);
                });
            }
        });
    }

    // 2. Other elements reveal
    gsap.from('.hero-desc', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.5 });
    gsap.from('.btn-primary', { opacity: 0, y: 15, duration: 0.8, ease: 'power3.out', delay: 0.8 });
    gsap.from('.hero-image-wrap', { opacity: 0, scale: 0.7, rotation: -10, duration: 1.5, ease: 'expo.out', delay: 0.3 });
  };

  // === Ultra-Premium Minh Pham Style Text Animations ===
  const greeting = document.querySelector('.nav-greeting');
  if (greeting) {
    const originalText = greeting.dataset.original || greeting.textContent.trim();
    greeting.dataset.original = originalText;
    greeting.innerHTML = '';

    greeting.style.display = 'inline-flex';
    greeting.style.overflow = 'hidden';
    greeting.style.lineHeight = '1';

    const chars = [...originalText].map(char => {
      const wrapper = document.createElement('span');
      wrapper.style.display = 'inline-flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.position = 'relative';
      wrapper.style.height = '1em';
      wrapper.style.minWidth = char.trim() === '' ? '0.5em' : 'auto';

      const mainChar = document.createElement('span');
      mainChar.textContent = char;
      mainChar.style.height = '1em';

      const hoverChar = document.createElement('span');
      hoverChar.textContent = char;
      hoverChar.style.position = 'absolute';
      hoverChar.style.top = '100%';
      hoverChar.style.color = 'var(--accent)';

      wrapper.appendChild(mainChar);
      wrapper.appendChild(hoverChar);
      greeting.appendChild(wrapper);

      return { wrapper, mainChar, hoverChar, char };
    });

    // 1. "Animated into Namastey" - Page Load Decode Sequence (Minh Pham signature)
    const scrambleChars = '!<>-_\\/[]{}—=+*^?#_';
    const oldStart = window.startDecodeSequence;
    window.startDecodeSequence = () => {
      if (oldStart) oldStart();
      gsap.delayedCall(0.5, () => {
        chars.forEach((c, i) => {
          let iterations = 0;
          const maxIterations = 8 + (i * 3); // Staggered reveal

          let scrambleInterval = setInterval(() => {
            if (iterations >= maxIterations) {
              clearInterval(scrambleInterval);
              c.mainChar.textContent = c.char;
              c.hoverChar.textContent = c.char;
              gsap.fromTo(c.mainChar, { color: 'var(--accent)', scale: 1.2 }, { color: 'var(--text)', scale: 1, duration: 0.4 });
            } else {
              const randomChar = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
              c.mainChar.textContent = randomChar;
              c.hoverChar.textContent = randomChar;
              iterations++;
            }
          }, 50);
        });
      });
    };

    // 2. 3D Hover Roll Effect
    greeting.addEventListener('mouseenter', () => {
      chars.forEach((c, i) => {
        gsap.to([c.mainChar, c.hoverChar], {
          y: '-100%',
          duration: 0.4,
          ease: 'power3.inOut',
          delay: i * 0.03
        });
      });
    });

    greeting.addEventListener('mouseleave', () => {
      chars.forEach((c, i) => {
        gsap.to([c.mainChar, c.hoverChar], {
          y: '0%',
          duration: 0.4,
          ease: 'power3.inOut',
          delay: i * 0.03
        });
      });
    });
  }

  // === Infinite Levitation ===
  gsap.to('.hero-image-wrap', {
    y: -12,
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    delay: 1.4 // Starts exactly as entrance animation finishes
  });

  // === Ambient Music Particles ===
  const particleContainer = document.createElement('div');
  particleContainer.className = 'ambient-particles';
  document.querySelector('.main-container')?.prepend(particleContainer);

  const notes = ['\u2669', '\u266A', '\u266B', '\u266C', '\u2728'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'ambient-particle';
    p.textContent = notes[Math.floor(Math.random() * notes.length)];
    particleContainer.appendChild(p);

    gsap.set(p, {
      x: () => Math.random() * window.innerWidth,
      y: () => window.innerHeight + Math.random() * 200,
      scale: () => 0.5 + Math.random() * 1.5,
      opacity: () => 0.05 + Math.random() * 0.15,
      rotation: () => Math.random() * 360
    });

    gsap.to(p, {
      y: () => -100,
      x: () => '+=' + (Math.random() * 100 - 50),
      rotation: () => '+=' + (Math.random() * 180),
      duration: () => 15 + Math.random() * 25,
      ease: 'none',
      repeat: -1,
      delay: () => Math.random() * -30
    });
  }

  // === Redundant burst listener removed to unify logic ===

  // === Magnetic Button ===
  const magneticBtn = document.querySelector('.btn-primary');
  if (magneticBtn) {
    magneticBtn.addEventListener('mousemove', (e) => {
      const rect = magneticBtn.getBoundingClientRect();
      const h = rect.width / 2;
      const v = rect.height / 2;
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - v;

      gsap.to(magneticBtn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.4,
        ease: 'power3.out'
      });

      const icon = magneticBtn.querySelector('i');
      if (icon) {
        gsap.to(icon, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: 'power3.out' });
      }
    });

    magneticBtn.addEventListener('mouseleave', () => {
      gsap.to(magneticBtn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
      const icon = magneticBtn.querySelector('i');
      if (icon) gsap.to(icon, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
    });
  }

  // === Ultra-Premium 3D Magnetic Image Tilt ===
  const heroImage = document.getElementById('heroImage');
  const heroFrame = document.querySelector('.hero-image-frame');

  if (heroImage && heroFrame) {
    heroFrame.addEventListener('mousemove', (e) => {
      const rect = heroFrame.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const distanceX = x - centerX;
      const distanceY = y - centerY;

      const rotateX = -distanceY * 0.08;
      const rotateY = distanceX * 0.08;

      // Smooth 3D tilt of the container
      gsap.to(heroFrame, {
        rotationX: rotateX,
        rotationY: rotateY,
        x: distanceX * 0.15,
        y: distanceY * 0.15,
        duration: 0.6,
        ease: 'power2.out',
        transformPerspective: 1200
      });
      // Add subtle glow tracing the mouse
      heroFrame.style.boxShadow = `${-rotateY}px ${rotateX}px 40px rgba(79, 70, 229, 0.4)`;

      // Secondary parallax on the image inside for immense depth
      gsap.to(heroImage, {
        x: distanceX * 0.06,
        y: distanceY * 0.06,
        scale: 1.08,
        duration: 0.6,
        ease: 'power2.out'
      });
    });

    heroFrame.addEventListener('mouseleave', () => {
      gsap.to(heroFrame, {
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        boxShadow: 'var(--shadow)',
        duration: 1.2,
        ease: 'elastic.out(1, 0.3)'
      });

      gsap.to(heroImage, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  }

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


// === Fully Animated Premium Custom Cursor ===
const interactiveSelector = 'a, button, input, .btn-primary, .focus-visual, .nav-toggle, .theme-toggle, .work-link, .contact-link';

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

if (typeof gsap !== 'undefined') {
  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  customCursor.innerHTML = '<i class="ri-music-2-fill" aria-hidden="true"></i>';
  document.body.appendChild(customCursor);

  const cursorX = gsap.quickTo(customCursor, "x", { duration: 0.25, ease: "power3" });
  const cursorY = gsap.quickTo(customCursor, "y", { duration: 0.25, ease: "power3" });

  gsap.set(customCursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Hide the default cursor specifically once the custom cursor is successfully initialized.
  document.body.style.cursor = 'none';
  const style = document.createElement('style');
  style.innerHTML = '* { cursor: none !important; }';
  document.head.appendChild(style);

  let activeHover = false;

  document.addEventListener('pointermove', (e) => {
    cursorX(e.clientX);
    cursorY(e.clientY);
  });

  const setHoverState = (isHover) => {
    if (activeHover === isHover) return;
    activeHover = isHover;
    if (isHover) {
      customCursor.classList.add('hover-active');
      gsap.to(customCursor, { scale: 1.25, rotation: -10, duration: 0.3, ease: 'back.out(1.5)' });
    } else {
      customCursor.classList.remove('hover-active');
      gsap.to(customCursor, { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.out' });
    }
  };

  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(interactiveSelector)) setHoverState(true);
  });

  document.addEventListener('pointerout', (e) => {
    if (activeHover) {
      const next = e.relatedTarget;
      if (!next || !next.closest(interactiveSelector)) setHoverState(false);
    }
  });

  document.addEventListener('click', (e) => {
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    
    // User requested: "not the text" click transition
    if (e.target.closest('.hero-content')) return;

    // Trigger big burst on "music" (image) and interactive elements
    if (e.target.closest('.hero-visual, .custom-cursor, ' + interactiveSelector)) {
      spawnNoteBurst(x, y, 12);
      gsap.fromTo(customCursor, { scale: 0.8 }, { scale: 1.25, duration: 0.4, ease: "elastic.out(1, 0.4)" });
    } else {
      spawnNoteBurst(x, y, 6);
    }
  });

  // === Creative Magnetic Hero Image Interaction ===
  const heroWrap = document.querySelector('.hero-image-wrap');
  if (heroWrap) {
    heroWrap.addEventListener('mousemove', (e) => {
      const rect = heroWrap.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(heroWrap, {
        x: x * 0.15,
        y: y * 0.15,
        rotateX: y * -0.05,
        rotateY: x * 0.05,
        duration: 0.4,
        ease: 'power2.out'
      });
    });
    heroWrap.addEventListener('mouseleave', () => {
      gsap.to(heroWrap, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
    });
  }

  // === Mask tracking circle removed as requested ('remove the circle') ===
}

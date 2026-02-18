'use strict';

/**
 * ========================================
 * DARK MODE TOGGLE
 * ========================================
 */

const themeBtn = document.querySelector('[data-theme-btn]');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Check if user has saved preference
const currentTheme = localStorage.getItem('theme') ||
  (prefersDarkScheme.matches ? 'dark' : 'light');

// Set theme on load
if (currentTheme === 'light') {
  document.body.classList.add('light-mode');
}

// Toggle theme
themeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
});

/**
 * ========================================
 * SIDEBAR 3-D FLIP TOGGLE
 * ========================================
 */

const sidebar = document.querySelector('[data-sidebar]');
const sidebarBtn = document.querySelector('[data-sidebar-btn]');
const sidebarBackBtn = document.querySelector('[data-sidebar-back-btn]');

function flipSidebar(show) {
  if (!sidebar) return;
  const flipped = typeof show === 'boolean' ? show : !sidebar.classList.contains('flipped');
  sidebar.classList.remove('splash-anim');
  void sidebar.offsetWidth;
  sidebar.classList.add('splash-anim');
  sidebar.classList.toggle('flipped', flipped);

  // ARIA: tell assistive tech which face is visible
  sidebarBtn?.setAttribute('aria-expanded', String(flipped));

  // After the transition ends, move focus to the newly-visible face
  const flipper = sidebar.querySelector('[data-sidebar-flipper]');
  const onEnd = () => {
    if (flipped) {
      sidebarBackBtn?.focus();
    } else {
      sidebarBtn?.focus();
    }
    sidebar.classList.remove('splash-anim');
    flipper?.removeEventListener('transitionend', onEnd);
  };
  flipper?.addEventListener('transitionend', onEnd);
}

sidebarBtn?.addEventListener('click', () => flipSidebar(true));
sidebarBackBtn?.addEventListener('click', () => flipSidebar(false));

/**
 * ========================================
 * NAVIGATION LINKS - PAGE SWITCHING
 * ========================================
 */

const navbarLinks = Array.from(document.querySelectorAll('.navbar [data-nav-link]'));
const pages = Array.from(document.querySelectorAll('[data-page]'));
const navbar = document.querySelector('.navbar');

const pageMap = {
  'about': 'about',
  'experience': 'experience',
  'portfolio': 'portfolio',
  'contact': 'contact'
};
let suppressScrollSpyUntil = 0;

function getNavTarget(link) {
  const key = (link.textContent || '').trim().toLowerCase();
  return pageMap[key] || key;
}

navbarLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = getNavTarget(link);
    const targetElement = document.querySelector(`[data-page="${pageName}"]`);
    if (targetElement) activatePage(targetElement, pageName);
  });
});

/**
 * ========================================
 * NAVBAR SCROLL BEHAVIOR
 * ========================================
 */

(() => {
  if (!navbar) return;

  let lastY = window.scrollY || 0;
  let ticking = false;

  const updateNavbarOnScroll = () => {
    const y = window.scrollY || 0;

    navbar.classList.toggle('navbar-scrolled', y > 8);
    navbar.classList.remove('navbar-hidden');

    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateNavbarOnScroll);
  }, { passive: true });
})();

function activatePage(pageElement, pageName) {
  // Prevent scrollspy from briefly overriding click-driven active state.
  suppressScrollSpyUntil = performance.now() + 450;

  // Deactivate all pages
  pages.forEach(page => page.classList.remove('active'));

  // Deactivate all navbar links
  navbarLinks.forEach(link => link.classList.remove('active'));

  // Activate selected page
  pageElement.classList.add('active');

  // Activate corresponding nav link
  const normalizedPage = String(pageName || pageElement.dataset.page || '').toLowerCase();
  navbarLinks.forEach(link => {
    link.classList.toggle('active', getNavTarget(link) === normalizedPage);
  });

  // Scroll the selected section into view (smooth)
  pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * ========================================
 * FILTER FUNCTIONALITY (PORTFOLIO)
 * ========================================
 */

const filterSelect = document.querySelector('[data-select]');

// Filter select dropdown toggle
filterSelect?.addEventListener('click', () => {
  filterSelect.classList.toggle('active');
});

// Note: Filter button click handlers and select item handlers are bound
// dynamically in portfolio-data.js after projects are rendered.
// The script.js only handles the select dropdown open/close toggle.

/**
 * ========================================
 * CONTACT FORM HANDLING
 * ========================================
 */

const contactForm = document.getElementById('contactForm');
const formInputs = document.querySelectorAll('[data-form-input]');
const formBtn = document.querySelector('[data-form-btn]');

// Enable/disable form button based on validation
formInputs.forEach(input => {
  input.addEventListener('input', () => {
    if (contactForm.checkValidity()) {
      formBtn.removeAttribute('disabled');
    } else {
      formBtn.setAttribute('disabled', '');
    }
  });
});

// Contact form submission is handled by portfolio-data.js (API POST)
// which replaces this mailto approach with a proper database submission.

/**
 * ========================================
 * NOTIFICATION SYSTEM
 * ========================================
 */

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Expose globally for portfolio-data.js
window.showNotification = showNotification;

/**
 * ========================================
 * SMOOTH SCROLL HELPER
 * ========================================
 */

function scrollToSection(sectionName) {
  const section = document.querySelector(`[data-page="${sectionName}"]`);
  if (section) {
    activatePage(section, sectionName);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Make scrollToSection globally accessible
window.scrollToSection = scrollToSection;

/**
 * ========================================
 * INTERSECTION OBSERVER FOR ANIMATIONS
 * ========================================
 */

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe service items and project items
document.querySelectorAll('.service-item, .project-item').forEach(item => {
  item.style.opacity = '0';
  item.style.transform = 'translateY(20px)';
  item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(item);
});

/**
 * ========================================
 * KEYBOARD NAVIGATION
 * ========================================
 */

document.addEventListener('keydown', (e) => {
  // Flip sidebar back with Escape key
  if (e.key === 'Escape') {
    flipSidebar(false);
    filterSelect?.classList.remove('active');
  }
});

/**
 * ========================================
 * ANIMATION STYLES
 * ========================================
 */

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

document.head.appendChild(style);

/**
 * ========================================
 * PERFORMANCE: LAZY LOAD IMAGES
 * ========================================
 */

if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

/**
 * ========================================
 * SCROLLSPY / NAV HIGHLIGHT ON SCROLL
 * ========================================
 */

// Keep navbar highlight synced with the section currently in view.
(() => {
  const navLinks = navbarLinks;
  const sections = Array.from(document.querySelectorAll('[data-page]'));
  if (!navLinks.length || !sections.length) return;

  let ticking = false;

  function setActiveNav(id) {
    if (!id) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', getNavTarget(link) === id);
    });
  }

  function getCurrentSectionId() {
    const visibleSections = sections.filter((s) => getComputedStyle(s).display !== 'none');
    if (!visibleSections.length) return '';

    // Use an anchor line near the top content area (below fixed navbar).
    const anchorY = Math.max(120, window.innerHeight * 0.28);
    let best = visibleSections[0];
    let bestScore = -Infinity;

    visibleSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const intersectsAnchor = rect.top <= anchorY && rect.bottom >= anchorY;
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, window.innerHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const score = (intersectsAnchor ? 100000 : 0) + visibleHeight;
      if (score > bestScore) {
        best = section;
        bestScore = score;
      }
    });

    return (best.dataset.page || '').toLowerCase();
  }

  const update = () => {
    if (performance.now() >= suppressScrollSpyUntil) {
      setActiveNav(getCurrentSectionId());
    }
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();

/**
 * ========================================
 * RESPONSIVE ENHANCEMENTS
 * ========================================
 */

// Handle safe area padding for notched devices
(() => {
  const root = document.documentElement;
  const applySafeArea = () => {
    const topPadding = CSS.supports('padding: max(0px)')
      ? 'max(1rem, env(safe-area-inset-top))'
      : '1rem';
    const bottomPadding = CSS.supports('padding: max(0px)')
      ? 'max(1rem, env(safe-area-inset-bottom))'
      : '1rem';

    root.style.setProperty('--safe-area-top', `env(safe-area-inset-top, 0px)`);
    root.style.setProperty('--safe-area-bottom', `env(safe-area-inset-bottom, 0px)`);
  };

  applySafeArea();
  window.addEventListener('orientationchange', applySafeArea);
})();

// Optimize layout for viewport changes
(() => {
  let resizeTimer;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Recalculate layout-sensitive elements
      const navbarLinks = document.querySelectorAll('.navbar-link');
      navbarLinks.forEach(link => {
        // Ensure proper sizing on orientation change
        link.style.minHeight = window.innerWidth < 600 ? '44px' : 'auto';
      });
    }, 250);
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
})();

// Touch-friendly enhancements
(() => {
  const isTouchDevice = () => {
    return (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0)
    );
  };

  if (isTouchDevice()) {
    document.documentElement.classList.add('is-touch-device');

    // Add touch feedback to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [onclick], .clickable');
    interactiveElements.forEach(el => {
      el.addEventListener('touchstart', () => {
        el.style.opacity = '0.7';
      }, { passive: true });

      el.addEventListener('touchend', () => {
        el.style.opacity = '1';
      }, { passive: true });
    });
  }
})();

// Responsive image loading optimization
(() => {
  const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, observerOptions);

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
})();

// Viewport metadata debugging (comment out in production)
(() => {
  const getViewportInfo = () => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const dpr = window.devicePixelRatio || 1;

    let category = 'unknown';
    if (vw < 375) category = 'extra-small';
    else if (vw < 425) category = 'small';
    else if (vw < 600) category = 'medium';
    else if (vw < 900) category = 'tablet';
    else if (vw < 1024) category = 'small-desktop';
    else if (vw < 1440) category = 'desktop';
    else category = 'large-desktop';

    return { vw, vh, dpr, category };
  };

  window.getResponsiveInfo = getViewportInfo;
})();

// Handle viewport scale changes
(() => {
  let lastScale = window.visualViewport?.scale || 1;

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const currentScale = window.visualViewport.scale;
      if (Math.abs(currentScale - lastScale) > 0.1) {
        lastScale = currentScale;
        window.dispatchEvent(new Event('viewport-zoom-change'));
      }
    }, { passive: true });
  }
})();

// Optimize form inputs for mobile
(() => {
  const formInputs = document.querySelectorAll('input[type], textarea, select');
  formInputs.forEach(input => {
    // Prevent zoom on input focus for iOS
    input.addEventListener('focus', () => {
      // Already handled by font-size: 16px in CSS
      input.style.fontSize = '16px';
    });
  });
})();

// Smooth scroll behavior for anchor links
(() => {
  if ('scrollBehavior' in document.documentElement.style) {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
})();

// Detect reduced motion preference
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (prefersReducedMotion.matches) {
    document.documentElement.style.setProperty('--duration-fast', '0ms');
    document.documentElement.style.setProperty('--duration-base', '0ms');
    document.documentElement.style.setProperty('--duration-slow', '0ms');
  }

  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.style.setProperty('--duration-fast', '0ms');
      document.documentElement.style.setProperty('--duration-base', '0ms');
      document.documentElement.style.setProperty('--duration-slow', '0ms');
    } else {
      document.documentElement.style.removeProperty('--duration-fast');
      document.documentElement.style.removeProperty('--duration-base');
      document.documentElement.style.removeProperty('--duration-slow');
    }
  });
})();

console.log('Portfolio scripts loaded successfully!');

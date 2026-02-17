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
 * SIDEBAR TOGGLE
 * ========================================
 */

const sidebar = document.querySelector('[data-sidebar]');
const sidebarBtn = document.querySelector('[data-sidebar-btn]');

sidebarBtn?.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
  if (!sidebar?.contains(e.target) && !sidebarBtn?.contains(e.target)) {
    sidebar?.classList.remove('active');
  }
});

/**
 * ========================================
 * NAVIGATION LINKS - PAGE SWITCHING
 * ========================================
 */

const navigationLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

navigationLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetPage = link.textContent.toLowerCase();

    // Handle "Get In Touch" / Contact - activate + SCROLL so banner becomes visible
    const txt = link.textContent.trim();
    if (txt === 'Get In Touch' || txt === 'Contact') {
      // scrollToSection activates the contact page AND scrolls it into view
      scrollToSection('contact');
    } else {
      // Map page names
      const pageMap = {
        'about': 'about',
        'experience': 'experience',
        'portfolio': 'portfolio',
        'contact': 'contact'
      };

      const actualPage = pageMap[targetPage] || targetPage;
      const targetElement = document.querySelector(`[data-page="${actualPage}"]`);

      if (targetElement) {
        activatePage(targetElement, actualPage);
      }
    }
  });
});

function activatePage(pageElement, pageName) {
  // Deactivate all pages
  pages.forEach(page => page.classList.remove('active'));

  // Deactivate all nav links
  navigationLinks.forEach(link => link.classList.remove('active'));

  // Activate selected page
  pageElement.classList.add('active');

  // Activate corresponding nav link
  const activeLink = document.querySelector(`[data-nav-link]:not([onclick*="scrollToSection"])`);
  if (activeLink && pageElement.dataset.page === pageName) {
    const links = Array.from(navigationLinks).filter(
      link => !link.getAttribute('onclick')
    );
    links.forEach(link => {
      if (link.textContent.toLowerCase() === pageName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Scroll the selected section into view (smooth)
  pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * ========================================
 * FILTER FUNCTIONALITY (PORTFOLIO)
 * ========================================
 */

const filterSelect = document.querySelector('[data-select]');
const filterSelectItems = document.querySelectorAll('[data-select-item]');
const filterSelectValue = document.querySelector('[data-select-value]');
const filterBtns = document.querySelectorAll('[data-filter-btn]');
const projectItems = document.querySelectorAll('[data-filter-item]');

// Filter select dropdown
filterSelect?.addEventListener('click', () => {
  filterSelect.classList.toggle('active');
});

// Filter select items
filterSelectItems.forEach(item => {
  item.addEventListener('click', () => {
    const selectedValue = item.getAttribute('data-select-item');
    filterSelectValue.textContent = item.textContent;
    filterSelect.classList.remove('active');
    filterFunc(selectedValue);
  });
});

// Filter buttons
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    // Remove active from all buttons
    filterBtns.forEach(b => b.classList.remove('active'));
    // Add active to clicked button
    btn.classList.add('active');
    // Filter projects
    const selectedValue = btn.getAttribute('data-filter-btn');
    filterFunc(selectedValue);
  });
});

function filterFunc(selectedValue) {
  projectItems.forEach(item => {
    if (selectedValue === 'all') {
      item.classList.add('active');
    } else if (item.dataset.category === selectedValue) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

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
  // Close sidebar with Escape key
  if (e.key === 'Escape') {
    sidebar?.classList.remove('active');
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

// Use IntersectionObserver to toggle `.active` on navbar links as sections enter viewport
(() => {
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
  const sections = Array.from(document.querySelectorAll('[data-page]'));
  if (!navLinks.length || !sections.length || !('IntersectionObserver' in window)) return;

  const spyOptions = {
    root: null,
    threshold: 0.5,
    rootMargin: '0px 0px -10% 0px'
  };

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.dataset.page && entry.target.dataset.page.toLowerCase();
        navLinks.forEach(link => {
          const txt = link.textContent.trim().toLowerCase();
          link.classList.toggle('active', txt === id);
        });
      }
    });
  }, spyOptions);

  sections.forEach(s => spyObserver.observe(s));
})();

console.log('Portfolio scripts loaded successfully!');

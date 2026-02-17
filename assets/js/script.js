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

    // Handle "Get In Touch" button special case
    if (link.textContent === 'Get In Touch' || link.textContent === 'Contact') {
      const contactPage = document.querySelector('[data-page="contact"]');
      if (contactPage) {
        activatePage(contactPage, 'contact');
      }
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

  // Scroll to top
  window.scrollTo(0, 0);
}

/**
 * ========================================
 * FILTER FUNCTIONALITY (PORTFOLIO)
 * ========================================
 */

const filterSelect = document.querySelector('[data-select]');
const filterSelectItems = document.querySelectorAll('[data-select-item]');
const filterSelectValue = document.querySelector('[data-selecct-value]');
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

// Handle form submission
if (contactForm) {
  contactForm.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const fullname = document.querySelector('input[name="fullname"]');
  const email = document.querySelector('input[name="email"]');
  const message = document.querySelector('textarea[name="message"]');

  // Validate inputs
  if (!fullname.value.trim() || !email.value.trim() || !message.value.trim()) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  // Create mailto link
  const subject = 'Message from Contact Form';
  const body = `Full Name: ${fullname.value.trim()}\n\nEmail: ${email.value.trim()}\n\nMessage: ${message.value.trim()}`;
  const mailtoLink = `mailto:riyazofficial.222001@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Open email client
  window.open(mailtoLink, '_blank');

  // Show success message
  showNotification('Redirecting to email client...', 'success');

  // Reset form
  setTimeout(() => {
    contactForm.reset();
    formBtn.setAttribute('disabled', '');
  }, 1000);
}

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

console.log('Portfolio scripts loaded successfully!');

/**
 * ========================================
 * PORTFOLIO DYNAMIC DATA RENDERER
 * Fetches data from MongoDB via API and
 * renders all sections dynamically.
 * ========================================
 */

'use strict';

const PortfolioRenderer = (() => {
     // Auto detect API base (same logic as admin/js/api.js)
     // Allow explicit override via <meta name="api-base" content="https://api.example.com"> in `index.html`.
     const metaApi = document.querySelector('meta[name="api-base"]')?.getAttribute('content');
     const port = window.location.port;
     const detected = (port === '5000' || port === '') ? '/api' : 'http://localhost:5000/api';
     // Normalize meta: allow providing root (https://host) or api path (https://host/api)
     const API_BASE = (function () {
          if (metaApi) {
               const raw = metaApi.replace(/\/+$/, '');
               return raw.endsWith('/api') ? raw : `${raw}/api`;
          }
          return detected;
     })(); // meta overrides default detection

     console.log('[PortfolioData] API base URL:', API_BASE);

     // Resolve DB-stored '/api/...' paths to absolute URLs when needed
     function resolveUrl(url) {
          if (!url) return url;
          try {
               if (!url.startsWith('/api')) return url;
               const base = API_BASE.replace(/\/+$/g, '');
               if (base.endsWith('/api')) return base.replace(/\/api$/, '') + url;
               return base + url;
          } catch (e) {
               return url;
          }
     }

     // ─── HTTP helper with enhanced logging ─────────────────────────
     async function apiFetch(path) {
          try {
               console.log(`[PortfolioData] → Fetching ${path}...`);
               const res = await fetch(`${API_BASE}${path}`);
               if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || `HTTP ${res.status}`);
               }
               const data = await res.json();
               console.log(`[PortfolioData] ✓ ${path} loaded`, { keys: data.data ? Object.keys(data.data).slice(0, 5) : null });
               if (data.data && typeof data.data === 'object') console.log(`[PortfolioData] Data for ${path}:`, data.data);
               return data;
          } catch (err) {
               console.error(`[PortfolioData] ✗ Failed to fetch ${path}:`, err.message);
               return null;
          }
     }

     // ─── Proficiency → percentage mapping ────────────────────────
     function proficiencyToPercent(p) {
          const map = { Beginner: 40, Intermediate: 60, Advanced: 80, Expert: 95 };
          return map[p] || 70;
     }

     // ─── Icon name mapping (for ionicons) ─────────────────────────
     function ionIcon(name) {
          return `<ion-icon name="${name}"></ion-icon>`;
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Sidebar
     // ═══════════════════════════════════════════════════════════════
     function renderSidebar(pd) {
          if (!pd) return;

          // Name
          const nameEl = document.querySelector('.sidebar .name');
          if (nameEl) {
               const fullName = `${pd.firstName || ''} ${pd.lastName || ''}`.trim();
               if (fullName) {
                    nameEl.textContent = fullName;
                    nameEl.setAttribute('title', fullName);
               }
          }

          // Title
          const titleEl = document.querySelector('.sidebar .title');
          if (titleEl && pd.title) titleEl.textContent = pd.title;

          // Avatar
          if (pd.avatar) {
               const avatarImg = document.querySelector('.sidebar .avatar-box img');
               if (avatarImg) {
                    avatarImg.src = resolveUrl(pd.avatar);
                    avatarImg.alt = `${pd.firstName || ''} ${pd.lastName || ''}`.trim();
               }
          }

          // Contacts list (email, birthday, location)
          const contactsList = document.querySelector('.sidebar .contacts-list');
          if (contactsList) {
               let contactsHtml = '';

               if (pd.email) {
                    contactsHtml += `
          <li class="contact-item">
            <div class="icon-box">${ionIcon('mail-outline')}</div>
            <div class="contact-info">
              <p class="contact-title">Email</p>
              <a href="mailto:${pd.email}" class="contact-link">${pd.email}</a>
            </div>
          </li>`;
               }

               if (pd.birthday) {
                    const bday = new Date(pd.birthday);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formatted = bday.toLocaleDateString('en-US', options);
                    contactsHtml += `
          <li class="contact-item">
            <div class="icon-box">${ionIcon('calendar-outline')}</div>
            <div class="contact-info">
              <p class="contact-title">Birthday</p>
              <time datetime="${pd.birthday}">${formatted}</time>
            </div>
          </li>`;
               }

               if (pd.phone) {
                    contactsHtml += `
          <li class="contact-item">
            <div class="icon-box">${ionIcon('call-outline')}</div>
            <div class="contact-info">
              <p class="contact-title">Phone</p>
              <a href="tel:${pd.phone}" class="contact-link">${pd.phone}</a>
            </div>
          </li>`;
               }

               if (pd.location) {
                    contactsHtml += `
          <li class="contact-item">
            <div class="icon-box">${ionIcon('location-outline')}</div>
            <div class="contact-info">
              <p class="contact-title">Location</p>
              <address>${pd.location}</address>
            </div>
          </li>`;
               }

               if (contactsHtml) contactsList.innerHTML = contactsHtml;
          }

          // Social links
          const socialLinks = pd.socialLinks || [];
          if (socialLinks.length > 0) {
               const socialList = document.querySelector('.sidebar .social-list');
               if (socialList) {
                    socialList.innerHTML = socialLinks.map(link => {
                         const iconName = guessIonIconName(link.platform);
                         return `
            <li class="social-item">
              <a href="${link.url}" class="social-link" target="_blank" rel="noopener noreferrer">
                ${ionIcon(iconName)}
              </a>
            </li>`;
                    }).join('');
               }
          }
     }

     function guessIonIconName(platform) {
          if (!platform) return 'link-outline';
          const p = platform.toLowerCase();
          if (p.includes('linkedin')) return 'logo-linkedin';
          if (p.includes('github')) return 'logo-github';
          if (p.includes('twitter') || p.includes('x')) return 'logo-twitter';
          if (p.includes('instagram')) return 'logo-instagram';
          if (p.includes('facebook')) return 'logo-facebook';
          if (p.includes('youtube')) return 'logo-youtube';
          if (p.includes('dribbble')) return 'logo-dribbble';
          if (p.includes('behance')) return 'logo-behance';
          if (p.includes('discord')) return 'logo-discord';
          if (p.includes('stackoverflow')) return 'logo-stackoverflow';
          return 'link-outline';
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Hero section
     // ═══════════════════════════════════════════════════════════════
     function renderHero(pd, resume) {
          if (!pd) return;

          // Hero subtitle
          const heroSubtitle = document.querySelector('.hero-subtitle');
          if (heroSubtitle && pd.bio) {
               heroSubtitle.textContent = pd.bio;
          }

          // Hero title (customize based on title)
          const heroTitle = document.querySelector('.hero-title');
          if (heroTitle && pd.title) {
               heroTitle.innerHTML = `<span class="text-gradient">${pd.title.split(' ')[0]}</span> ${pd.title.split(' ').slice(1).join(' ') || ''}`;
          }

          // Resume download link
          if (resume?.fileUrl) {
               const resumeBtn = document.querySelector('.hero-cta .btn-secondary');
               if (resumeBtn) {
                    resumeBtn.href = resume.fileUrl;
                    resumeBtn.setAttribute('download', '');
               }
          }
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: About Me section
     // ═══════════════════════════════════════════════════════════════
     function renderAbout(pd) {
          if (!pd?.bio) return;
          const aboutContent = document.querySelector('.about-content');
          if (aboutContent) {
               // Split bio into paragraphs on double newline or use as single paragraph
               const paragraphs = pd.bio.split(/\n\n|\r\n\r\n/).filter(Boolean);
               aboutContent.innerHTML = paragraphs
                    .map(p => `<p class="about-text">${p.trim()}</p>`)
                    .join('');
          }
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Services
     // ═══════════════════════════════════════════════════════════════
     function renderServices(services) {
          if (!services || services.length === 0) return;
          const serviceList = document.querySelector('.service-list');
          if (!serviceList) return;

          serviceList.innerHTML = services.map(s => `
      <li class="service-item">
        <div class="service-icon-box">
          ${s.icon ? `<span style="font-size:1.5rem">${s.icon}</span>` : ionIcon('code-slash')}
        </div>
        <h4 class="h4 service-item-title">${s.title}</h4>
        <p class="service-item-text">${s.description}</p>
      </li>
    `).join('');

          // Re-observe for animations
          reObserveItems('.service-item');
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Skills
     // ═══════════════════════════════════════════════════════════════
     function renderSkills(skills) {
          if (!skills || skills.length === 0) return;
          const skillsContent = document.querySelector('.skills-content');
          if (!skillsContent) return;

          // Group by category
          const grouped = {};
          skills.forEach(s => {
               const cat = s.category || 'Other';
               if (!grouped[cat]) grouped[cat] = [];
               grouped[cat].push(s);
          });

          skillsContent.innerHTML = Object.entries(grouped).map(([cat, items]) => `
      <div class="skill-category">
        <h4 class="category-title">${cat}</h4>
        <div class="skill-bars">
          ${items.map(s => `
            <div class="skill-bar">
              <div class="skill-name">${s.name}</div>
              <div class="progress-bar">
                <div class="progress" style="width: ${proficiencyToPercent(s.proficiency)}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Experience Timeline
     // ═══════════════════════════════════════════════════════════════
     function renderExperience(experience) {
          if (!experience || experience.length === 0) return;
          const workTimeline = document.getElementById('workTimeline');
          if (!workTimeline) return;

          workTimeline.innerHTML = experience.map(e => {
               const start = e.startDate
                    ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : '';
               const end = e.current
                    ? 'Present'
                    : (e.endDate ? new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
               const dateStr = start ? `${start} — ${end}` : '';
               return `
        <li class="timeline-item">
          <h4 class="h4 timeline-item-title">${e.role || ''}</h4>
          <span class="timeline-text">${e.company || ''}${e.location ? ' · ' + e.location : ''}</span>
          <span class="timeline-date">${dateStr}</span>
          <p class="timeline-description">${e.description || ''}</p>
          ${e.responsibilities?.length ? `<ul class="timeline-responsibilities">${e.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
        </li>
      `;
          }).join('');
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Education Timeline
     // ═══════════════════════════════════════════════════════════════
     function renderEducation(education) {
          if (!education || education.length === 0) return;
          const eduTimeline = document.getElementById('educationTimeline');
          if (!eduTimeline) return;

          eduTimeline.innerHTML = education.map(e => {
               const dateStr = e.startYear
                    ? `${e.startYear} - ${e.endYear || 'Present'}`
                    : '';
               return `
        <li class="timeline-item">
          <h4 class="h4 timeline-item-title">${e.degree || ''}${e.field ? ' — ' + e.field : ''}</h4>
          <span class="timeline-text">${e.institution || ''}${e.grade ? ' · ' + e.grade : ''}</span>
          <span class="timeline-date">${dateStr}</span>
          <p class="timeline-description">${e.description || ''}</p>
        </li>
      `;
          }).join('');
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Technical Proficiency (experience page skill bars)
     // ═══════════════════════════════════════════════════════════════
     function renderTechProficiency(skills) {
          if (!skills || skills.length === 0) return;
          const skillsList = document.querySelector('.skills-list');
          if (!skillsList) return;

          // Group by category and create aggregate bars
          const grouped = {};
          skills.forEach(s => {
               const cat = s.category || 'Other';
               if (!grouped[cat]) grouped[cat] = { total: 0, count: 0 };
               grouped[cat].total += proficiencyToPercent(s.proficiency);
               grouped[cat].count += 1;
          });

          skillsList.innerHTML = Object.entries(grouped).map(([cat, data]) => {
               const avg = Math.round(data.total / data.count);
               return `
        <li class="skill-item">
          <span class="skill-label">${cat}</span>
          <div class="skill-progress">
            <div class="progress" style="width: ${avg}%"></div>
          </div>
        </li>
      `;
          }).join('');
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Portfolio / Projects
     // ═══════════════════════════════════════════════════════════════
     function renderProjects(projects) {
          if (!projects || projects.length === 0) return;
          const projectList = document.querySelector('.project-list');
          if (!projectList) return;

          // Collect unique categories for filters
          const categories = new Set();
          projects.forEach(p => {
               (p.techStack || []).forEach(t => {
                    const cat = guessCategoryFromTech(t);
                    if (cat !== 'all') categories.add(cat);
               });
          });

          projectList.innerHTML = projects.map(p => {
               const category = guessProjectCategory(p);
               const imgSrc = resolveUrl(p.images?.[0]) || './assets/images/project-placeholder.jpg';
               const linkUrl = p.liveUrl || p.githubUrl || '#';
               return `
        <div class="project-item active" data-filter-item data-category="${category}">
          <a href="${linkUrl}" target="_blank" rel="noopener noreferrer">
            <article class="project-card">
              <div class="project-img">
                <img src="${imgSrc}" alt="${p.title}" onerror="this.style.display='none'">
                <div class="project-item-icon-box">🔗</div>
              </div>
              <h3 class="project-title">${p.title}</h3>
              <div class="project-category">${p.description ? p.description.substring(0, 60) : ''}</div>
              <div style="padding:.75rem .75rem .875rem;display:flex;gap:.5rem;flex-wrap:wrap">
                ${(p.techStack || []).map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
            </article>
          </a>
        </div>
      `;
          }).join('');

          // Update filter buttons based on actual categories
          updateFilterButtons(categories);

          // Re-observe and re-bind filter
          reObserveItems('.project-item');
          rebindProjectFilters();
     }

     function guessProjectCategory(project) {
          const stack = (project.techStack || []).join(' ').toLowerCase();
          const title = (project.title || '').toLowerCase();
          const desc = (project.description || '').toLowerCase();
          const all = `${stack} ${title} ${desc}`;
          if (all.match(/mobile|ionic|react native|flutter|capacitor|android|ios/)) return 'mobile';
          if (all.match(/design|figma|sketch|ui kit|brand/)) return 'design';
          if (all.match(/ui\/ux|ux|prototype|wireframe|user research/)) return 'uiux';
          return 'web';
     }

     function guessCategoryFromTech(tech) {
          const t = tech.toLowerCase();
          if (t.match(/mobile|ionic|react native|flutter|capacitor/)) return 'mobile';
          if (t.match(/design|figma|sketch/)) return 'design';
          if (t.match(/ui\/ux|ux|prototype/)) return 'uiux';
          return 'web';
     }

     function updateFilterButtons(categories) {
          // Update desktop filter buttons
          const filterList = document.querySelector('.filter-list');
          if (filterList) {
               let html = '<li><button class="filter-btn active" data-filter-btn="all">All</button></li>';
               const defaultCats = ['web', 'mobile', 'design', 'uiux'];
               const allCats = new Set([...defaultCats, ...categories]);
               allCats.forEach(cat => {
                    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                    html += `<li><button class="filter-btn" data-filter-btn="${cat}">${label === 'Uiux' ? 'UI/UX' : label}</button></li>`;
               });
               filterList.innerHTML = html;
          }

          // Update mobile select dropdown
          const selectList = document.querySelector('.select-list');
          if (selectList) {
               let html = '<li class="select-item" data-select-item="all"><button>All</button></li>';
               const defaultCats = ['web', 'mobile', 'design', 'uiux'];
               const allCats = new Set([...defaultCats, ...categories]);
               allCats.forEach(cat => {
                    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                    html += `<li class="select-item" data-select-item="${cat}"><button>${label === 'Uiux' ? 'UI/UX' : label}</button></li>`;
               });
               selectList.innerHTML = html;
          }
     }

     function rebindProjectFilters() {
          // Re-bind filter buttons after dynamic render
          const filterBtns = document.querySelectorAll('[data-filter-btn]');
          const projectItems = document.querySelectorAll('[data-filter-item]');
          const filterSelectItems = document.querySelectorAll('[data-select-item]');
          const filterSelectValue = document.querySelector('[data-select-value]');

          filterBtns.forEach(btn => {
               btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const val = btn.getAttribute('data-filter-btn');
                    projectItems.forEach(item => {
                         item.classList.toggle('active', val === 'all' || item.dataset.category === val);
                    });
               });
          });

          filterSelectItems.forEach(item => {
               item.addEventListener('click', () => {
                    const val = item.getAttribute('data-select-item');
                    if (filterSelectValue) filterSelectValue.textContent = item.textContent;
                    const filterSelect = document.querySelector('[data-select]');
                    if (filterSelect) filterSelect.classList.remove('active');
                    projectItems.forEach(pi => {
                         pi.classList.toggle('active', val === 'all' || pi.dataset.category === val);
                    });
               });
          });
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Contact Info
     // ═══════════════════════════════════════════════════════════════
     function renderContactInfo(pd) {
          if (!pd) return;
          const contactItemList = document.querySelector('.contact-item-list');
          if (!contactItemList) return;

          let html = '';

          if (pd.email) {
               html += `
        <li class="contact-item">
          <div class="icon-box">${ionIcon('mail')}</div>
          <div class="contact-info">
            <p class="contact-title">Email</p>
            <a href="mailto:${pd.email}" class="contact-link">${pd.email}</a>
          </div>
        </li>`;
          }

          if (pd.phone) {
               html += `
        <li class="contact-item">
          <div class="icon-box">${ionIcon('call')}</div>
          <div class="contact-info">
            <p class="contact-title">Phone</p>
            <a href="tel:${pd.phone}" class="contact-link">${pd.phone}</a>
          </div>
        </li>`;
          }

          if (pd.location) {
               html += `
        <li class="contact-item">
          <div class="icon-box">${ionIcon('location')}</div>
          <div class="contact-info">
            <p class="contact-title">Location</p>
            <address class="contact-link">${pd.location}</address>
          </div>
        </li>`;
          }

          if (html) contactItemList.innerHTML = html;

          // Update social links in contact section
          const socialLinks = pd.socialLinks || [];
          if (socialLinks.length > 0) {
               const contactSocialList = document.querySelector('.contact-section .social-list');
               if (contactSocialList) {
                    contactSocialList.innerHTML = socialLinks.map(link => {
                         const iconName = guessIonIconName(link.platform);
                         return `
            <li class="social-item">
              <a href="${link.url}" class="social-link" target="_blank" rel="noopener noreferrer">
                ${ionIcon(iconName)}
              </a>
            </li>`;
                    }).join('');
               }
          }
     }

     // ═══════════════════════════════════════════════════════════════
     //  RENDER: Page title / meta
     // ═══════════════════════════════════════════════════════════════
     function updatePageMeta(pd) {
          if (!pd) return;
          const fullName = `${pd.firstName || ''} ${pd.lastName || ''}`.trim();
          if (fullName) {
               document.title = `${fullName} - ${pd.title || 'Portfolio'}`;
               const ogTitle = document.querySelector('meta[property="og:title"]');
               if (ogTitle) ogTitle.setAttribute('content', `${fullName} - ${pd.title || ''}`);
          }
          if (pd.bio) {
               const metaDesc = document.querySelector('meta[name="description"]');
               if (metaDesc) metaDesc.setAttribute('content', pd.bio.substring(0, 160));
               const ogDesc = document.querySelector('meta[property="og:description"]');
               if (ogDesc) ogDesc.setAttribute('content', pd.bio.substring(0, 160));
          }
     }

     // ═══════════════════════════════════════════════════════════════
     //  Re-observe items for intersection animation
     // ═══════════════════════════════════════════════════════════════
     function reObserveItems(selector) {
          const items = document.querySelectorAll(selector);
          const observer = new IntersectionObserver((entries) => {
               entries.forEach(entry => {
                    if (entry.isIntersecting) {
                         entry.target.style.opacity = '1';
                         entry.target.style.transform = 'translateY(0)';
                    }
               });
          }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

          items.forEach(item => {
               item.style.opacity = '0';
               item.style.transform = 'translateY(20px)';
               item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
               observer.observe(item);
          });
     }

     // ═══════════════════════════════════════════════════════════════
     //  CONTACT FORM → API
     // ═══════════════════════════════════════════════════════════════
     function setupContactForm() {
          const form = document.getElementById('contactForm');
          if (!form) return;

          // Remove any existing listener by cloning
          const newForm = form.cloneNode(true);
          form.parentNode.replaceChild(newForm, form);

          // Re-bind input validation
          const inputs = newForm.querySelectorAll('[data-form-input]');
          const btn = newForm.querySelector('[data-form-btn]');

          inputs.forEach(input => {
               input.addEventListener('input', () => {
                    if (newForm.checkValidity()) btn?.removeAttribute('disabled');
                    else btn?.setAttribute('disabled', '');
               });
          });

          newForm.addEventListener('submit', async (e) => {
               e.preventDefault();

               const fullname = newForm.querySelector('input[name="fullname"]');
               const email = newForm.querySelector('input[name="email"]');
               const message = newForm.querySelector('textarea[name="message"]');

               if (!fullname?.value.trim() || !email?.value.trim() || !message?.value.trim()) {
                    showNotification('Please fill in all fields', 'error');
                    return;
               }

               // Disable submit button
               if (btn) {
                    btn.setAttribute('disabled', '');
                    btn.textContent = 'Sending...';
               }

               try {
                    const res = await fetch(`${API_BASE}/contact/submit`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                              name: fullname.value.trim(),
                              email: email.value.trim(),
                              subject: 'Message from Contact Form',
                              message: message.value.trim(),
                         }),
                    });

                    const data = await res.json();

                    if (res.ok && data.success) {
                         showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                         newForm.reset();
                         if (btn) btn.setAttribute('disabled', '');
                    } else {
                         throw new Error(data.message || 'Failed to send message');
                    }
               } catch (err) {
                    console.error('[Contact] Submit error:', err.message);
                    showNotification(err.message || 'Failed to send message. Please try again.', 'error');
               } finally {
                    if (btn) btn.textContent = 'Send Message';
               }
          });
     }

     // ═══════════════════════════════════════════════════════════════
     //  showNotification (uses the one from script.js if available)
     // ═══════════════════════════════════════════════════════════════
     function showNotification(message, type = 'info') {
          // Use global showNotification if available
          if (window.showNotification) {
               window.showNotification(message, type);
               return;
          }

          const notification = document.createElement('div');
          notification.className = `notification notification-${type}`;
          notification.textContent = message;
          notification.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      z-index: 9999; animation: slideIn .3s ease-out;
    `;
          document.body.appendChild(notification);
          setTimeout(() => {
               notification.style.animation = 'slideOut .3s ease-out';
               setTimeout(() => notification.remove(), 300);
          }, 3000);
     }

     // ═══════════════════════════════════════════════════════════════
     //  INIT — Fetch everything and render
     // ═══════════════════════════════════════════════════════════════
     async function init() {
          console.log('[PortfolioData] Initializing — fetching from MongoDB API...');
          console.log('[PortfolioData] Request timestamp:', new Date().toISOString());

          // Fetch all data in parallel
          const startTime = performance.now();
          const [portfolioRes, servicesRes, testimonialsRes] = await Promise.all([
               apiFetch('/portfolio'),
               apiFetch('/services'),
               apiFetch('/testimonials'),
          ]);
          const loadTime = performance.now() - startTime;
          console.log(`[PortfolioData] Data fetched in ${loadTime.toFixed(0)}ms`);

          const portfolio = portfolioRes?.data;
          const services = servicesRes?.data || [];
          const testimonials = testimonialsRes?.data || [];

          if (!portfolio) {
               console.warn('[PortfolioData] ⚠ No portfolio found in MongoDB');
               console.log('[PortfolioData] Admin URL: /admin');
               // Show a message in the hero section
               const heroTitle = document.querySelector('.hero-title');
               if (heroTitle) heroTitle.innerHTML = 'Welcome to <span class="text-gradient">My</span> Portfolio';
               const heroSubtitle = document.querySelector('.hero-subtitle');
               if (heroSubtitle) heroSubtitle.textContent = 'Content is being set up. Please check back soon!';
               const nameEl = document.querySelector('.sidebar .name');
               if (nameEl) nameEl.textContent = 'Portfolio';
               // Still render services if they exist separately
               if (services.length > 0) renderServices(services);
               setupContactForm();
               return;
          }

          console.log('[PortfolioData] ✓ Portfolio loaded from MongoDB:', { _id: portfolio._id, personalDetails: !!portfolio.personalDetails });

          const pd = portfolio.personalDetails || {};

          // Render all sections
          renderSidebar(pd);
          renderHero(pd, portfolio.resume);
          renderAbout(pd);
          renderServices(services);
          renderSkills(portfolio.skills || []);
          renderExperience(portfolio.experience || []);
          renderEducation(portfolio.education || []);
          renderTechProficiency(portfolio.skills || []);
          renderProjects(portfolio.projects || []);
          renderContactInfo(pd);
          updatePageMeta(pd);
          setupContactForm();

          console.log('[PortfolioData] ✓ Portfolio fully rendered.');
     }

     // Refresh function to manually re-sync portfolio data from MongoDB
     async function refreshPortfolio() {
          console.log('[PortfolioData] Manual refresh at', new Date().toISOString());
          console.log('[PortfolioData] Re-fetching data from MongoDB...');
          await init();
          console.log('[PortfolioData] Refresh complete - latest data displayed.');
     }

     // Start when DOM is ready
     if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
     } else {
          init();
     }

     return { init, refreshPortfolio };
})();

// Make refresh available globally: type window.refreshPortfolioData() in browser console
window.refreshPortfolioData = async () => {
     if (typeof PortfolioRenderer !== 'undefined' && PortfolioRenderer.refreshPortfolio) {
          await PortfolioRenderer.refreshPortfolio();
     } else {
          console.error('[PortfolioData] Refresh function not available');
     }
};

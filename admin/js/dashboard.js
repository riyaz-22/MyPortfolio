/* ═══════════════════════════════════════════════════════════════
   Dashboard Logic  (admin/dashboard.html)
   — Fetches data from MongoDB APIs, renders all sections,
     handles CRUD operations with loading/error/empty states.
   ═══════════════════════════════════════════════════════════════ */

console.log('[Dashboard] Script loaded');

// ── Auth guard ──
if (!Api.getToken()) {
     console.warn('[Dashboard] No token — redirecting to login');
     window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
let portfolio = null;   // cached portfolio document
let services = [];
let testimonials = [];
let currentSection = 'overview';

// ═══════════════════════════════════════════════════════════════
//  DOM HELPERS
// ═══════════════════════════════════════════════════════════════
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

// Resolve API-backed URLs saved in DB (e.g. "/api/uploads/file/..") to
// the correct origin when admin is hosted on GitHub Pages or another origin.
function resolveUrl(url) {
     if (!url) return url;
     try {
          if (!url.startsWith('/api')) return url;
          const base = (typeof API_BASE !== 'undefined' ? API_BASE : '/api').replace(/\/+$|\s+$/g, '');
          if (base.endsWith('/api')) {
               return base.replace(/\/api$/, '') + url; // avoid duplicate /api
          }
          return base + url;
     } catch (e) {
          return url;
     }
}

// ═══════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
function toast(msg, type = 'success') {
     const c = $('#toastContainer');
     const t = document.createElement('div');
     t.className = `toast toast-${type}`;
     t.textContent = msg;
     c.appendChild(t);
     setTimeout(() => t.remove(), 3500);
     if (type === 'error') console.error('[Toast]', msg);
     else console.log('[Toast]', msg);
}

// ═══════════════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('click', e => {
     const closeBtn = e.target.closest('[data-close]');
     if (closeBtn) closeModal(closeBtn.dataset.close);
     if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ═══════════════════════════════════════════════════════════════
//  SECTION NAVIGATION
// ═══════════════════════════════════════════════════════════════
function navigateTo(section) {
     console.log('[Nav] →', section);
     currentSection = section;
     $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === section));
     $$('.section').forEach(s => s.classList.toggle('active', s.id === `sec-${section}`));
     const titles = {
          overview: 'Dashboard', profile: 'Profile', skills: 'Skills',
          services: 'Services', projects: 'Portfolio', experience: 'Experience',
          education: 'Education', testimonials: 'Testimonials', resume: 'Resume',
          contact: 'Messages', settings: 'Settings',
     };
     $('#topbarTitle').textContent = titles[section] || section;

     const loaders = {
          overview: loadOverview, profile: loadProfile, skills: loadSkills,
          services: loadServices, projects: loadProjects, experience: loadExperience,
          education: loadEducation, testimonials: loadTestimonials, resume: loadResume,
          contact: loadMessages,
     };
     if (loaders[section]) loaders[section]();
}

// Wire up sidebar nav items
$$('.nav-item').forEach(n => {
     n.addEventListener('click', e => {
          e.preventDefault();
          navigateTo(n.dataset.section);
          sidebar.classList.remove('open');
     });
});

// Sidebar toggle (mobile)
const sidebar = $('#sidebar');
$('#hamburger')?.addEventListener('click', () => sidebar.classList.toggle('open'));
$('#sidebarClose')?.addEventListener('click', () => sidebar.classList.remove('open'));

// Logout
$('#logoutBtn')?.addEventListener('click', () => {
     console.log('[Auth] Logging out');
     Api.clearAuth();
     window.location.href = 'index.html';
});

// ═══════════════════════════════════════════════════════════════
//  INIT — runs on page load
// ═══════════════════════════════════════════════════════════════
(async function init() {
     console.log('[Init] Starting dashboard initialization');

     // Set user info in sidebar/topbar
     const user = Api.getUser();
     if (user) {
          $('#userName').textContent = user.name || user.email;
          $('#sidebarUserName').textContent = user.name || 'Admin';
          const avatar = $('#sidebar .sidebar-user-avatar');
          if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
     }

     // Check API health
     try {
          const health = await Api.healthCheck();
          console.log('[Init] API health:', health);
          const cs = $('#connectionStatus');
          cs.classList.add('connected');
          cs.querySelector('.status-text').textContent = 'Connected';
          cs.title = 'Connected to server';
          $('#apiStatus').textContent = 'Online';
          $('#apiStatus').style.color = 'var(--success)';
          $('#dbStatus').textContent = 'Connected';
          $('#dbStatus').style.color = 'var(--success)';
          $('#serverTime').textContent = new Date(health.timestamp).toLocaleString();
     } catch (err) {
          console.error('[Init] Health check failed:', err.message);
          const cs = $('#connectionStatus');
          cs.classList.add('disconnected');
          cs.querySelector('.status-text').textContent = 'Disconnected';
          cs.title = 'Cannot reach server';
          $('#apiStatus').textContent = 'Offline';
          $('#apiStatus').style.color = 'var(--danger)';
          $('#dbStatus').textContent = 'Unknown';
          $('#dbStatus').style.color = 'var(--warning)';
          toast('Cannot connect to server. Check if backend is running.', 'error');
     }

     // Fetch portfolio data
     try {
          console.log('[Init] Fetching portfolio data...');
          const res = await Api.getPortfolio();
          portfolio = res.data;
          // Enable/disable social link button depending on portfolio presence
          const addSocialBtnInit = $('#addSocialLink');
          if (addSocialBtnInit) addSocialBtnInit.disabled = !portfolio;
          console.log('[Init] Portfolio loaded:', portfolio ? 'OK' : 'null');
     } catch (err) {
          portfolio = null;
          console.warn('[Init] No portfolio found (first time?):', err.message);
     }

     // Load overview stats
     loadOverview();
     loadUnreadBadge();

     // Hide page loader, show dashboard
     const pageLoader = $('#pageLoader');
     if (pageLoader) {
          pageLoader.classList.add('fade-out');
          setTimeout(() => pageLoader.remove(), 400);
     }

     console.log('[Init] Dashboard ready');
})();

// ═══════════════════════════════════════════════════════════════
//  OVERVIEW (Dashboard home)
// ═══════════════════════════════════════════════════════════════
async function loadOverview() {
     console.log('[Overview] Loading stats');

     // Profile status
     if (portfolio && portfolio.personalDetails?.firstName) {
          $('#statProfile').textContent = 'Active';
          $('#statProfile').style.color = 'var(--success)';
     } else {
          $('#statProfile').textContent = 'Setup';
          $('#statProfile').style.color = 'var(--warning)';
     }

     // Skills & projects from portfolio
     $('#statSkills').textContent = portfolio?.skills?.length || 0;
     $('#statProjects').textContent = portfolio?.projects?.length || 0;

     // Testimonials count
     try {
          const t = await Api.getTestimonials();
          $('#statTestimonials')  // not a stat for testimonials in overview, but keep for message count
     } catch { /* silent */ }

     // Messages count
     try {
          const u = await Api.unreadCount();
          $('#statMessages').textContent = u.data?.count || 0;
     } catch (err) {
          console.warn('[Overview] Failed to fetch message count:', err.message);
          $('#statMessages').textContent = '?';
     }
}

async function loadUnreadBadge() {
     try {
          const u = await Api.unreadCount();
          const badge = $('#unreadBadge');
          const count = u.data?.count || 0;
          if (badge) {
               badge.textContent = count;
               badge.style.display = '';
               badge.classList.toggle('muted', count === 0);
          }
     } catch (err) {
          console.warn('[Badge] Failed to load unread count:', err.message);
     }
}

// ═══════════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════════
function loadProfile() {
     console.log('[Profile] Loading...');
     const loader = $('#profileLoader');
     const error = $('#profileError');
     const content = $('#profileContent');

     // If portfolio exists, show form immediately
     hide(loader); hide(error); show(content);

     if (!portfolio) {
          console.log('[Profile] No portfolio — showing empty form for creation');
     }

     const pd = portfolio?.personalDetails || {};
     const form = $('#profileForm');
     form.firstName.value = pd.firstName || '';
     form.lastName.value = pd.lastName || '';
     form.title.value = pd.title || '';
     form.email.value = pd.email || '';
     form.phone.value = pd.phone || '';
     form.location.value = pd.location || '';
     form.bio.value = pd.bio || '';
     form.avatar.value = pd.avatar || '';
     updateAvatarPreview();
     renderSocialLinks(pd.socialLinks || []);
     // Disable "Add Social Link" if no portfolio exists yet
     const addSocialBtn = $('#addSocialLink');
     if (addSocialBtn) addSocialBtn.disabled = !portfolio;
}

function updateAvatarPreview() {
     const url = $('#profileForm')?.avatar?.value;
     const preview = $('#avatarPreview');
     if (preview) {
          const resolved = resolveUrl(url);
          preview.innerHTML = resolved ? `<img src="${resolved}" alt="avatar" onerror="this.remove()">` : '';
     }
}

$('#avatarFile')?.addEventListener('change', async e => {
     const file = e.target.files[0];
     if (!file) return;
     try {
          console.log('[Profile] Uploading avatar image...');
          const preview = $('#avatarPreview');
          if (preview) preview.innerHTML = '<p style="color:var(--text-secondary);font-size:.8125rem">Uploading...</p>';
          const res = await Api.uploadFile(file);
          const url = res.data.fileUrl;
          $('#profileForm').avatar.value = url;
          updateAvatarPreview();
          toast('Profile image uploaded');
     } catch (err) {
          toast(err.message, 'error');
          updateAvatarPreview();
     }
});

function renderSocialLinks(links) {
     const c = $('#socialLinksContainer');
     if (!c) return;
     if (!links.length) {
          c.innerHTML = '<p class="text-secondary" style="font-size:.8125rem">No social links added.</p>';
          return;
     }

     c.innerHTML = links.map((l, idx) => `
         <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;">
              <input type="text" value="${l.platform}" style="flex:1" readonly>
              <input type="text" value="${l.url}" style="flex:2" readonly>
              <div style="display:flex;flex-direction:column;gap:.25rem;margin-left:.25rem">
                   <button type="button" class="btn btn-sm" title="Move up" onclick="moveSocialLink('${l._id}','up')" ${idx === 0 ? 'disabled' : ''}>↑</button>
                   <button type="button" class="btn btn-sm" title="Move down" onclick="moveSocialLink('${l._id}','down')" ${idx === links.length - 1 ? 'disabled' : ''}>↓</button>
              </div>
              <button type="button" class="btn btn-danger btn-sm" style="margin-left:.5rem" onclick="removeSocialLink('${l._id}')">×</button>
         </div>
    `).join('');
}

$('#addSocialLink')?.addEventListener('click', async () => {
     const platform = prompt('Platform name (e.g. GitHub, LinkedIn):');
     if (!platform) return;
     const url = prompt('URL:');
     if (!url) return;
     try {
          const res = await Api.addSocialLink({ platform, url, icon: '' });
          portfolio.personalDetails.socialLinks = res.data;
          renderSocialLinks(res.data);
          toast('Social link added');
     } catch (err) { toast(err.message, 'error'); }
});

window.removeSocialLink = async id => {
     if (!confirm('Remove this social link?')) return;
     try {
          const res = await Api.deleteSocialLink(id);
          portfolio.personalDetails.socialLinks = res.data;
          renderSocialLinks(res.data);
          toast('Social link removed');
     } catch (err) { toast(err.message, 'error'); }
};

// Move a social link up or down in the array and persist the new order
window.moveSocialLink = async (id, dir) => {
     try {
          const list = portfolio?.personalDetails?.socialLinks || [];
          const idx = list.findIndex(x => x._id === id);
          if (idx === -1) return;
          const newIdx = dir === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= list.length) return;

          // Create a shallow copy and swap
          const updated = list.slice();
          const tmp = updated[newIdx];
          updated[newIdx] = updated[idx];
          updated[idx] = tmp;

          // Persist by updating personalDetails.socialLinks (replace array)
          await Api.updateSection('personalDetails', { socialLinks: updated });
          // Update local cache and re-render
          portfolio.personalDetails.socialLinks = updated;
          renderSocialLinks(updated);
          toast('Social links reordered');
     } catch (err) {
          console.error('[SocialLinks] Reorder failed:', err.message);
          toast(err.message, 'error');
     }
};

$('#profileForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          firstName: form.firstName.value,
          lastName: form.lastName.value,
          title: form.title.value,
          email: form.email.value,
          phone: form.phone.value,
          location: form.location.value,
          bio: form.bio.value,
          avatar: form.avatar.value,
     };

     try {
          if (!portfolio) {
               console.log('[Profile] Creating new portfolio...');
               const res = await Api.createPortfolio({ personalDetails: body });
               portfolio = res.data;
               console.log('[Profile] ✓ Portfolio created. Document ID:', portfolio._id);
               console.log('[Profile] Personal details saved:', portfolio.personalDetails);
               // Enable add social link now that portfolio exists
               const addSocialBtnAfterCreate = $('#addSocialLink');
               if (addSocialBtnAfterCreate) addSocialBtnAfterCreate.disabled = false;
               toast('Portfolio created and saved to database!');
          } else {
               console.log('[Profile] Updating profile for document ID:', portfolio._id);
               console.log('[Profile] Sending to API:', body);
               const updateRes = await Api.updateSection('personalDetails', body);
               // Capture updated data from API response
               if (updateRes && updateRes.data) {
                    console.log('[Profile] ✓ API returned updated section:', updateRes.data);
                    portfolio.personalDetails = updateRes.data;
               } else {
                    // Fallback: merge locally with logged warning
                    console.warn('[Profile] API response missing updated data, using local state');
                    Object.assign(portfolio.personalDetails, body);
               }
               console.log('[Profile] Current portfolio state:', portfolio.personalDetails);
               // Ensure add social link is enabled after updating profile
               const addSocialBtnAfterUpdate = $('#addSocialLink');
               if (addSocialBtnAfterUpdate) addSocialBtnAfterUpdate.disabled = false;
               toast('Profile updated and saved to database!');
          }
     } catch (err) {
          console.error('[Profile] Save failed with error:', err.message);
          toast(err.message, 'error');
     }
});

// ═══════════════════════════════════════════════════════════════
//  SKILLS
// ═══════════════════════════════════════════════════════════════
function loadSkills() {
     console.log('[Skills] Loading...');
     const loader = $('#skillsLoader');
     const content = $('#skillsContent');
     const empty = $('#skillsEmpty');
     const table = $('#skillsTableWrap');

     hide(loader); show(content);

     const skills = portfolio?.skills || [];
     if (skills.length === 0) {
          show(empty); hide(table);
     } else {
          hide(empty); show(table);
          const tbody = $('#skillsTable tbody');
          tbody.innerHTML = skills.map(s => `
               <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.category || '—'}</td>
                    <td><span class="tag">${s.proficiency || '—'}</span></td>
                    <td class="actions">
                         <button class="btn btn-outline btn-sm" onclick="editSkill('${s._id}')">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteSkill('${s._id}')">Del</button>
                    </td>
               </tr>
          `).join('');
     }
}

$('#addSkillBtn')?.addEventListener('click', () => {
     $('#skillModalTitle').textContent = 'Add Skill';
     $('#skillForm').reset();
     $('#skillForm').skillId.value = '';
     openModal('skillModal');
});

window.editSkill = id => {
     const s = portfolio?.skills?.find(x => x._id === id);
     if (!s) return;
     const form = $('#skillForm');
     form.skillId.value = id;
     form.name.value = s.name;
     form.category.value = s.category;
     form.proficiency.value = s.proficiency;
     form.icon.value = s.icon || '';
     $('#skillModalTitle').textContent = 'Edit Skill';
     openModal('skillModal');
};

window.deleteSkill = async id => {
     if (!confirm('Delete this skill?')) return;
     try {
          const res = await Api.deleteItem('skills', id);
          portfolio.skills = res.data;
          loadSkills();
          toast('Skill deleted');
     } catch (err) { toast(err.message, 'error'); }
};

$('#skillForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          name: form.name.value,
          category: form.category.value,
          proficiency: form.proficiency.value,
          icon: form.icon.value,
     };
     const id = form.skillId.value;

     try {
          if (id) { await Api.updateItem('skills', id, body); toast('Skill updated'); }
          else { await Api.addItem('skills', body); toast('Skill added'); }
          const res = await Api.getSection('skills');
          portfolio.skills = res.data;
          loadSkills();
          closeModal('skillModal');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  SERVICES
// ═══════════════════════════════════════════════════════════════
async function loadServices() {
     console.log('[Services] Loading...');
     const loader = $('#servicesLoader');
     const content = $('#servicesContent');
     const empty = $('#servicesEmpty');

     show(loader); hide(content);

     try {
          const res = await Api.getServices();
          services = res.data || [];
     } catch (err) {
          console.error('[Services] Load error:', err.message);
          services = [];
     }

     hide(loader); show(content);

     if (services.length === 0) {
          show(empty);
          $('#servicesGrid').innerHTML = '';
     } else {
          hide(empty);
          $('#servicesGrid').innerHTML = services.map(s => `
               <div class="item-card">
                    <h4>${s.icon || '📋'} ${s.title}</h4>
                    <p>${s.description}</p>
                    <div class="item-actions">
                         <button class="btn btn-outline btn-sm" onclick="editService('${s._id}')">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteService('${s._id}')">Delete</button>
                    </div>
               </div>
          `).join('');
     }
}

$('#addServiceBtn')?.addEventListener('click', () => {
     $('#serviceModalTitle').textContent = 'Add Service';
     $('#serviceForm').reset();
     $('#serviceForm').serviceId.value = '';
     openModal('serviceModal');
});

window.editService = id => {
     const s = services.find(x => x._id === id);
     if (!s) return;
     const form = $('#serviceForm');
     form.serviceId.value = id;
     form.title.value = s.title;
     form.description.value = s.description;
     form.icon.value = s.icon || '';
     form.order.value = s.order || 0;
     $('#serviceModalTitle').textContent = 'Edit Service';
     openModal('serviceModal');
};

window.deleteService = async id => {
     if (!confirm('Delete this service?')) return;
     try {
          await Api.deleteService(id);
          toast('Service deleted');
          loadServices();
     } catch (err) { toast(err.message, 'error'); }
};

$('#serviceForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          title: form.title.value,
          description: form.description.value,
          icon: form.icon.value,
          order: parseInt(form.order.value) || 0,
     };
     const id = form.serviceId.value;

     try {
          if (id) { await Api.updateService(id, body); toast('Service updated'); }
          else { await Api.createService(body); toast('Service added'); }
          loadServices();
          closeModal('serviceModal');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════════
function loadProjects() {
     console.log('[Projects] Loading...');
     const loader = $('#projectsLoader');
     const content = $('#projectsContent');
     const empty = $('#projectsEmpty');

     hide(loader); show(content);

     const projects = portfolio?.projects || [];
     if (projects.length === 0) {
          show(empty);
          $('#projectsGrid').innerHTML = '';
     } else {
          hide(empty);
          $('#projectsGrid').innerHTML = projects.map(p => `
               <div class="item-card">
                    ${p.images?.[0] ? `<img src="${resolveUrl(p.images[0])}" alt="${p.title}" onerror="this.remove()">` : ''}
                    <h4>${p.title} ${p.featured ? '<span class="tag">Featured</span>' : ''}</h4>
                    <p>${(p.description || '').substring(0, 100)}${(p.description || '').length > 100 ? '...' : ''}</p>
                    <div class="item-meta">
                         ${(p.techStack || []).map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                    <div class="item-actions">
                         <button class="btn btn-outline btn-sm" onclick="editProject('${p._id}')">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteProject('${p._id}')">Delete</button>
                    </div>
               </div>
          `).join('');
     }
}

$('#addProjectBtn')?.addEventListener('click', () => {
     $('#projectModalTitle').textContent = 'Add Project';
     $('#projectForm').reset();
     $('#projectForm').projectId.value = '';
     $('#projectImagePreview').innerHTML = '';
     openModal('projectModal');
});

window.editProject = id => {
     const p = portfolio?.projects?.find(x => x._id === id);
     if (!p) return;
     const form = $('#projectForm');
     form.projectId.value = id;
     form.title.value = p.title;
     form.description.value = p.description;
     form.techStack.value = (p.techStack || []).join(', ');
     form.githubUrl.value = p.githubUrl || '';
     form.liveUrl.value = p.liveUrl || '';
     form.images.value = (p.images || []).join(',');
     form.order.value = p.order || 0;
     form.featured.checked = p.featured || false;
     $('#projectImagePreview').innerHTML = p.images?.[0] ? `<img src="${resolveUrl(p.images[0])}" alt="preview">` : '';
     $('#projectModalTitle').textContent = 'Edit Project';
     openModal('projectModal');
};

window.deleteProject = async id => {
     if (!confirm('Delete this project?')) return;
     try {
          const res = await Api.deleteItem('projects', id);
          portfolio.projects = res.data;
          loadProjects();
          toast('Project deleted');
     } catch (err) { toast(err.message, 'error'); }
};

$('#projectImageFile')?.addEventListener('change', async e => {
     const file = e.target.files[0];
     if (!file) return;
     try {
          console.log('[Projects] Uploading image...');
          const res = await Api.uploadFile(file);
          const url = res.data.fileUrl;
          $('#projectForm').images.value = url;
          $('#projectImagePreview').innerHTML = `<img src="${resolveUrl(url)}" alt="preview">`;
          toast('Image uploaded');
     } catch (err) { toast(err.message, 'error'); }
});

$('#projectForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          title: form.title.value,
          description: form.description.value,
          techStack: form.techStack.value.split(',').map(s => s.trim()).filter(Boolean),
          githubUrl: form.githubUrl.value,
          liveUrl: form.liveUrl.value,
          images: form.images.value ? form.images.value.split(',').map(s => s.trim()) : [],
          order: parseInt(form.order.value) || 0,
          featured: form.featured.checked,
     };
     const id = form.projectId.value;

     try {
          if (id) { await Api.updateItem('projects', id, body); toast('Project updated'); }
          else { await Api.addItem('projects', body); toast('Project added'); }
          const res = await Api.getSection('projects');
          portfolio.projects = res.data;
          loadProjects();
          closeModal('projectModal');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  EXPERIENCE
// ═══════════════════════════════════════════════════════════════
function loadExperience() {
     console.log('[Experience] Loading...');
     const loader = $('#experienceLoader');
     const content = $('#experienceContent');
     const empty = $('#experienceEmpty');

     hide(loader); show(content);

     const exp = portfolio?.experience || [];
     if (exp.length === 0) {
          show(empty);
          $('#experienceList').innerHTML = '';
     } else {
          hide(empty);
          $('#experienceList').innerHTML = exp.map(e => {
               const start = e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
               const end = e.current ? 'Present' : (e.endDate ? new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
               return `
                    <div class="timeline-item">
                         <h4>${e.role} <span class="text-secondary">@ ${e.company}</span></h4>
                         <div class="timeline-meta">${start} — ${end} ${e.location ? '| ' + e.location : ''}</div>
                         <p>${e.description || ''}</p>
                         <div class="item-actions">
                              <button class="btn btn-outline btn-sm" onclick="editExperience('${e._id}')">Edit</button>
                              <button class="btn btn-danger btn-sm" onclick="deleteExperience('${e._id}')">Delete</button>
                         </div>
                    </div>
               `;
          }).join('');
     }
}

$('#addExperienceBtn')?.addEventListener('click', () => {
     $('#experienceModalTitle').textContent = 'Add Experience';
     $('#experienceForm').reset();
     $('#experienceForm').experienceId.value = '';
     openModal('experienceModal');
});

window.editExperience = id => {
     const e = portfolio?.experience?.find(x => x._id === id);
     if (!e) return;
     const form = $('#experienceForm');
     form.experienceId.value = id;
     form.company.value = e.company;
     form.role.value = e.role;
     form.startDate.value = e.startDate ? e.startDate.substring(0, 10) : '';
     form.endDate.value = e.endDate ? e.endDate.substring(0, 10) : '';
     form.location.value = e.location || '';
     form.current.checked = e.current || false;
     form.description.value = e.description || '';
     form.responsibilities.value = (e.responsibilities || []).join('\n');
     $('#experienceModalTitle').textContent = 'Edit Experience';
     openModal('experienceModal');
};

window.deleteExperience = async id => {
     if (!confirm('Delete this experience?')) return;
     try {
          const res = await Api.deleteItem('experience', id);
          portfolio.experience = res.data;
          loadExperience();
          toast('Experience deleted');
     } catch (err) { toast(err.message, 'error'); }
};

$('#experienceForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          company: form.company.value,
          role: form.role.value,
          startDate: form.startDate.value,
          endDate: form.endDate.value || null,
          location: form.location.value,
          current: form.current.checked,
          description: form.description.value,
          responsibilities: form.responsibilities.value.split('\n').map(s => s.trim()).filter(Boolean),
     };
     const id = form.experienceId.value;

     try {
          if (id) { await Api.updateItem('experience', id, body); toast('Experience updated'); }
          else { await Api.addItem('experience', body); toast('Experience added'); }
          const res = await Api.getSection('experience');
          portfolio.experience = res.data;
          loadExperience();
          closeModal('experienceModal');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  EDUCATION
// ═══════════════════════════════════════════════════════════════
function loadEducation() {
     console.log('[Education] Loading...');
     const loader = $('#educationLoader');
     const content = $('#educationContent');
     const empty = $('#educationEmpty');

     hide(loader); show(content);

     const edu = portfolio?.education || [];
     if (edu.length === 0) {
          show(empty);
          $('#educationList').innerHTML = '';
     } else {
          hide(empty);
          $('#educationList').innerHTML = edu.map(e => `
               <div class="timeline-item">
                    <h4>${e.degree} ${e.field ? '— ' + e.field : ''}</h4>
                    <div class="timeline-meta">${e.institution} | ${e.startYear}–${e.endYear || 'Present'} ${e.grade ? '| ' + e.grade : ''}</div>
                    <p>${e.description || ''}</p>
                    <div class="item-actions">
                         <button class="btn btn-outline btn-sm" onclick="editEducation('${e._id}')">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteEducation('${e._id}')">Delete</button>
                    </div>
               </div>
          `).join('');
     }
}

$('#addEducationBtn')?.addEventListener('click', () => {
     $('#educationModalTitle').textContent = 'Add Education';
     $('#educationForm').reset();
     $('#educationForm').educationId.value = '';
     openModal('educationModal');
});

window.editEducation = id => {
     const e = portfolio?.education?.find(x => x._id === id);
     if (!e) return;
     const form = $('#educationForm');
     form.educationId.value = id;
     form.institution.value = e.institution;
     form.degree.value = e.degree;
     form.field.value = e.field || '';
     form.startYear.value = e.startYear;
     form.endYear.value = e.endYear || '';
     form.grade.value = e.grade || '';
     form.description.value = e.description || '';
     $('#educationModalTitle').textContent = 'Edit Education';
     openModal('educationModal');
};

window.deleteEducation = async id => {
     if (!confirm('Delete this education?')) return;
     try {
          const res = await Api.deleteItem('education', id);
          portfolio.education = res.data;
          loadEducation();
          toast('Education deleted');
     } catch (err) { toast(err.message, 'error'); }
};

$('#educationForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          institution: form.institution.value,
          degree: form.degree.value,
          field: form.field.value,
          startYear: parseInt(form.startYear.value),
          endYear: form.endYear.value ? parseInt(form.endYear.value) : undefined,
          grade: form.grade.value,
          description: form.description.value,
     };
     const id = form.educationId.value;

     try {
          if (id) { await Api.updateItem('education', id, body); toast('Education updated'); }
          else { await Api.addItem('education', body); toast('Education added'); }
          const res = await Api.getSection('education');
          portfolio.education = res.data;
          loadEducation();
          closeModal('educationModal');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  TESTIMONIALS
// ═══════════════════════════════════════════════════════════════
async function loadTestimonials() {
     console.log('[Testimonials] Loading...');
     const loader = $('#testimonialsLoader');
     const content = $('#testimonialsContent');
     const empty = $('#testimonialsEmpty');

     show(loader); hide(content);

     try {
          const res = await Api.getTestimonials();
          testimonials = res.data || [];
     } catch (err) {
          console.error('[Testimonials] Load error:', err.message);
          testimonials = [];
     }

     hide(loader); show(content);

     if (testimonials.length === 0) {
          show(empty);
          $('#testimonialsGrid').innerHTML = '';
     } else {
          hide(empty);
          $('#testimonialsGrid').innerHTML = testimonials.map(t => `
               <div class="item-card">
                    <h4>${t.name}</h4>
                    <p class="text-secondary" style="font-size:.75rem">${t.role || ''} ${t.company ? '@ ' + t.company : ''}</p>
                    <p>"${(t.content || '').substring(0, 120)}${(t.content || '').length > 120 ? '...' : ''}"</p>
                    <p style="color:var(--warning);font-size:.875rem">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</p>
                    <div class="item-actions">
                         <button class="btn btn-outline btn-sm" onclick="editTestimonial('${t._id}')">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteTestimonial('${t._id}')">Delete</button>
                    </div>
               </div>
          `).join('');
     }
}

function updateTestimonialAvatarPreview() {
     const url = $('#testimonialForm')?.avatar?.value;
     const preview = $('#testimonialAvatarPreview');
     if (preview) {
          const resolved = resolveUrl(url);
          preview.innerHTML = resolved ? `<img src="${resolved}" alt="avatar" onerror="this.remove()">` : '';
     }
}

$('#testimonialAvatarFile')?.addEventListener('change', async e => {
     const file = e.target.files[0];
     if (!file) return;
     try {
          const preview = $('#testimonialAvatarPreview');
          if (preview) preview.innerHTML = '<p style="color:var(--text-secondary);font-size:.8125rem">Uploading...</p>';
          const res = await Api.uploadFile(file);
          const url = res.data.fileUrl;
          $('#testimonialForm').avatar.value = url;
          updateTestimonialAvatarPreview();
          toast('Avatar photo uploaded');
     } catch (err) {
          toast(err.message, 'error');
          updateTestimonialAvatarPreview();
     }
});

$('#addTestimonialBtn')?.addEventListener('click', () => {
     $('#testimonialModalTitle').textContent = 'Add Testimonial';
     $('#testimonialForm').reset();
     $('#testimonialForm').testimonialId.value = '';
     updateTestimonialAvatarPreview();
     openModal('testimonialModal');
});

window.editTestimonial = id => {
     const t = testimonials.find(x => x._id === id);
     if (!t) return;
     const form = $('#testimonialForm');
     form.testimonialId.value = id;
     form.name.value = t.name;
     form.role.value = t.role || '';
     form.company.value = t.company || '';
     form.content.value = t.content;
     form.avatar.value = t.avatar || '';
     updateTestimonialAvatarPreview();
     form.rating.value = t.rating || 5;
     form.order.value = t.order || 0;
     $('#testimonialModalTitle').textContent = 'Edit Testimonial';
     openModal('testimonialModal');
};

window.deleteTestimonial = async id => {
     if (!confirm('Delete this testimonial?')) return;
     try {
          await Api.deleteTestimonial(id);
          toast('Testimonial deleted');
          loadTestimonials();
     } catch (err) { toast(err.message, 'error'); }
};

$('#testimonialForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          name: form.name.value,
          role: form.role.value,
          company: form.company.value,
          content: form.content.value,
          avatar: form.avatar.value,
          rating: parseInt(form.rating.value) || 5,
          order: parseInt(form.order.value) || 0,
     };
     const id = form.testimonialId.value;

     try {
          if (id) { await Api.updateTestimonial(id, body); toast('Testimonial updated'); }
          else { await Api.createTestimonial(body); toast('Testimonial added'); }
          loadTestimonials();
          closeModal('testimonialModal');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  RESUME
// ═══════════════════════════════════════════════════════════════
function loadResume() {
     console.log('[Resume] Loading...');
     hide($('#resumeLoader'));
     show($('#resumeContent'));

     const r = portfolio?.resume || {};
     const container = $('#currentResume');
     if (r.fileUrl) {
          const date = r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString() : 'N/A';
          container.innerHTML = `
               <div class="resume-info">
                    <svg viewBox="0 0 24 24" width="32" height="32" style="color:var(--primary)"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="currentColor"/></svg>
                    <div>
                         <a href="${r.fileUrl}" target="_blank">${r.fileUrl.split('/').pop()}</a>
                         <p class="text-secondary" style="font-size:.75rem">Last updated: ${date}</p>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="removeResume()">Remove</button>
               </div>
          `;
     } else {
          container.innerHTML = '<p class="text-secondary">No resume uploaded yet. Use the area below to upload one.</p>';
     }
}

$('#resumeFile')?.addEventListener('change', async e => {
     const file = e.target.files[0];
     if (!file) return;
     try {
          console.log('[Resume] Uploading...');
          const res = await Api.uploadFile(file);
          const fileUrl = res.data.fileUrl;
          await Api.updateSection('resume', { fileUrl, lastUpdated: new Date().toISOString() });
          portfolio.resume = { fileUrl, lastUpdated: new Date().toISOString() };
          loadResume();
          toast('Resume uploaded successfully');
     } catch (err) { toast(err.message, 'error'); }
});

window.removeResume = async () => {
     if (!confirm('Remove the current resume?')) return;
     try {
          await Api.updateSection('resume', { fileUrl: '', lastUpdated: new Date().toISOString() });
          portfolio.resume = { fileUrl: '', lastUpdated: new Date().toISOString() };
          loadResume();
          toast('Resume removed');
     } catch (err) { toast(err.message, 'error'); }
};

// ═══════════════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════════════
let msgPage = 1;

async function loadMessages() {
     console.log('[Messages] Loading page', msgPage);
     const loader = $('#contactLoader');
     const content = $('#contactContent');
     const empty = $('#messagesEmpty');

     show(loader); hide(content);

     const search = $('#messageSearch')?.value || '';
     const isRead = $('#messageFilter')?.value ?? '';
     const params = new URLSearchParams({ page: msgPage, limit: 15 });
     if (search) params.set('search', search);
     if (isRead !== '') params.set('isRead', isRead);

     try {
          const res = await Api.getMessages(params.toString());
          const { submissions, pagination } = res.data;

          hide(loader); show(content);

          if (submissions.length === 0) {
               show(empty);
               $('#messagesList').innerHTML = '';
               $('#messagesPagination').innerHTML = '';
          } else {
               hide(empty);
               renderMessages(submissions);
               renderPagination(pagination);
          }
     } catch (err) {
          console.error('[Messages] Load error:', err.message);
          hide(loader); show(content);
          show(empty);
          toast(err.message, 'error');
     }
}

function renderMessages(msgs) {
     $('#messagesList').innerHTML = msgs.map(m => {
          const date = new Date(m.createdAt).toLocaleDateString();
          return `
               <div class="message-row ${m.isRead ? '' : 'unread'}" onclick="viewMessage('${m._id}')">
                    <div class="message-info">
                         <div class="msg-name">${m.name} &lt;${m.email}&gt;</div>
                         <div class="msg-subject">${m.subject || '(no subject)'}</div>
                         <div class="msg-preview">${(m.message || '').substring(0, 80)}</div>
                    </div>
                    <span class="message-date">${date}</span>
                    <div class="message-actions-inline">
                         <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();toggleMsgRead('${m._id}')" title="${m.isRead ? 'Mark unread' : 'Mark read'}">${m.isRead ? '📭' : '📬'}</button>
                         <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteMsg('${m._id}')" title="Delete">🗑</button>
                    </div>
               </div>
          `;
     }).join('');
}

function renderPagination(p) {
     const c = $('#messagesPagination');
     if (!p || p.pages <= 1) { c.innerHTML = ''; return; }
     let html = '';
     for (let i = 1; i <= p.pages; i++) {
          html += `<button class="${i === p.page ? 'active' : ''}" onclick="goToMsgPage(${i})">${i}</button>`;
     }
     c.innerHTML = html;
}

window.goToMsgPage = page => { msgPage = page; loadMessages(); };

$('#messageSearch')?.addEventListener('input', debounce(() => { msgPage = 1; loadMessages(); }, 400));
$('#messageFilter')?.addEventListener('change', () => { msgPage = 1; loadMessages(); });

window.viewMessage = async id => {
     try {
          const res = await Api.getMessage(id);
          const m = res.data;
          if (!m.isRead) { await Api.toggleRead(id); loadUnreadBadge(); }
          const date = new Date(m.createdAt).toLocaleString();
          $('#messageDetail').innerHTML = `
               <div class="msg-detail-header">
                    <h4>${m.name}</h4>
                    <p class="text-secondary">${m.email} — ${date}</p>
                    <p><strong>Subject:</strong> ${m.subject || '(none)'}</p>
               </div>
               <div class="msg-detail-body">${m.message}</div>
               <div class="msg-detail-actions">
                    <a href="mailto:${m.email}" class="btn btn-primary btn-sm">Reply via Email</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteMsg('${m._id}');closeModal('messageModal')">Delete</button>
               </div>
          `;
          openModal('messageModal');
          loadMessages();
     } catch (err) { toast(err.message, 'error'); }
};

window.toggleMsgRead = async id => {
     try { await Api.toggleRead(id); loadMessages(); loadUnreadBadge(); }
     catch (err) { toast(err.message, 'error'); }
};

window.deleteMsg = async id => {
     if (!confirm('Delete this message?')) return;
     try { await Api.deleteMessage(id); loadMessages(); loadUnreadBadge(); toast('Message deleted'); }
     catch (err) { toast(err.message, 'error'); }
};

// ═══════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════
$('#changePasswordForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     if (form.newPassword.value !== form.confirmPassword.value) {
          toast('Passwords do not match', 'error');
          return;
     }
     try {
          const res = await Api.changePassword({
               currentPassword: form.currentPassword.value,
               newPassword: form.newPassword.value,
          });
          Api.setToken(res.data.token);
          form.reset();
          toast('Password changed successfully');
     } catch (err) { toast(err.message, 'error'); }
});

$('#contactInfoForm')?.addEventListener('submit', async e => {
     e.preventDefault();
     const form = e.target;
     const body = {
          email: form.email.value,
          phone: form.phone.value,
          location: form.location.value,
     };
     try {
          await Api.updateSection('personalDetails', body);
          if (portfolio) Object.assign(portfolio.personalDetails, body);
          toast('Contact info updated');
     } catch (err) { toast(err.message, 'error'); }
});

// ═══════════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════════
function debounce(fn, ms) {
     let t;
     return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

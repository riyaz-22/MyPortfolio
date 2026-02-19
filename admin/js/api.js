/* ═══════════════════════════════════════════════════════════════
   API Helper — shared between login & dashboard pages
   ═══════════════════════════════════════════════════════════════ */

// Resolve API base - prefer an explicit meta tag, then relative '/api' when served by the backend (port 5000).
// If the admin files are opened from another origin (e.g. Live Server or GitHub Pages),
// an `api-base` meta tag can force requests to the deployed backend URL.
const API_BASE = (() => {
     // Prefer explicit meta tag (allows admin to be hosted separately)
     try {
          const m = document.querySelector('meta[name="api-base"]');
          if (m && m.content) {
               // If running locally, prefer the local backend (avoid hitting production API)
               try {
                    const host = (location && location.hostname) ? location.hostname : '';
                    if (host === 'localhost' || host === '127.0.0.1') {
                         console.warn('[API] Running on localhost — forcing API base to http://localhost:5000/api (dev override)');
                         return 'http://localhost:5000/api';
                    }
               } catch (e) { /* ignore */ }

               // Normalize: accept either root (https://host) or full API URL (https://host/api)
               const raw = m.content.replace(/\/+$/, '');
               const normalized = raw.endsWith('/api') ? raw : `${raw}/api`;
               console.log('[API] base (from meta) =', normalized);
               return normalized;
          }
     } catch (e) {
          // document may be undefined in some contexts — ignore
     }

     // If served from GitHub Pages, use the deployed backend (avoid routing to github.io/api)
     try {
          if (location.hostname && location.hostname.includes('github.io')) {
               const fallback = 'https://my-portfolio-seven-iota-38.vercel.app/api';
               console.warn('[API] Running on GitHub Pages — forcing API base to', fallback);
               return fallback;
          }
     } catch (e) { }

     const host = location.hostname;
     const port = location.port;

     // Running from a different dev server (Live Server -> port !== 5000)
     if ((host === '127.0.0.1' || host === 'localhost') && port && port !== '5000') {
          console.warn('[API] Detected non-backend origin, using http://localhost:5000 as API base');
          return 'http://localhost:5000/api';
     }

     // Default - relative API (works when served from backend)
     return '/api';
})();

console.log('[API] base =', API_BASE);

const Api = {
     /* ── Token / User storage ── */
     getToken() { return localStorage.getItem('admin_token'); },
     setToken(t) { localStorage.setItem('admin_token', t); },
     getUser() { try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; } },
     setUser(u) { localStorage.setItem('admin_user', JSON.stringify(u)); },
     clearAuth() { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); },

     /* ── Core request method ── */
     async request(endpoint, options = {}) {
          const url = `${API_BASE}${endpoint}`;
          const method = options.method || 'GET';
          const headers = { ...options.headers };
          const showLoader = options.showLoader !== false; // Default: show loader

          if (!(options.body instanceof FormData)) {
               headers['Content-Type'] = 'application/json';
          }

          const token = this.getToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;

          // Log request with details
          const reqLog = { method, endpoint, timestamp: new Date().toISOString() };
          if (options.body && !(options.body instanceof FormData)) {
               try { reqLog.bodyPreview = JSON.stringify(options.body).substring(0, 200); } catch (e) { }
          }
          console.log(`[API] → ${method} ${endpoint}`, reqLog);

          // Show loader if enabled
          if (showLoader && typeof LoaderManager !== 'undefined') {
               LoaderManager.show();
          }

          try {
               const res = await fetch(url, {
                    ...options,
                    headers,
                    body: options.body instanceof FormData
                         ? options.body
                         : options.body ? JSON.stringify(options.body) : undefined,
               });

               // Handle non-JSON responses
               const contentType = res.headers.get('content-type') || '';
               if (!contentType.includes('application/json')) {
                    console.error(`[API] Non-JSON response for ${url}:`, res.status, res.statusText);
                    throw new Error(`Server returned non-JSON response (${res.status})`);
               }

               const data = await res.json();

               if (!res.ok) {
                    const errorMsg = data.message || `Request failed (${res.status})`;
                    console.error(`[API] ✗ ${method} ${endpoint} failed (${res.status})`, errorMsg);
                    if (res.status === 401 && window.location.pathname.includes('dashboard')) {
                         console.warn('[API] 401 — redirecting to login');
                         this.clearAuth();
                         window.location.href = 'index.html';
                         return;
                    }
                    throw new Error(errorMsg);
               }

               // Log successful response with data preview
               const dataPreview = data.data ? (typeof data.data === 'object' ? Object.keys(data.data).slice(0, 5) : typeof data.data) : null;
               console.log(`[API] ✓ ${method} ${endpoint}`, { status: res.status, message: data.message, dataKeys: dataPreview });
               if (data.data) console.log(`[API] Data returned:`, data.data);
               return data;

          } catch (err) {
               if (err.name === 'TypeError' && err.message.includes('fetch')) {
                    console.error(`[API] Network error — is the server running?`, err);
                    throw new Error('Cannot reach server. Make sure the backend is running on port 5000.');
               }
               throw err;
          } finally {
               // Always hide loader when request completes
               if (showLoader && typeof LoaderManager !== 'undefined') {
                    LoaderManager.hide();
               }
          }
     },

     /* ── Auth ── */
     register(body) { return this.request('/auth/register', { method: 'POST', body }); },
     login(body) { return this.request('/auth/login', { method: 'POST', body }); },
     getMe() { return this.request('/auth/me'); },
     changePassword(body) { return this.request('/auth/change-password', { method: 'PATCH', body }); },

     /* ── Portfolio ── */
     getPortfolio() { return this.request('/portfolio'); },
     createPortfolio(body) { return this.request('/portfolio', { method: 'POST', body }); },
     getSection(section) { return this.request(`/portfolio/section/${section}`); },
     updateSection(section, body) { return this.request(`/portfolio/section/${section}`, { method: 'PATCH', body }); },
     addItem(section, body) { return this.request(`/portfolio/section/${section}/item`, { method: 'POST', body }); },
     updateItem(section, id, body) { return this.request(`/portfolio/section/${section}/item/${id}`, { method: 'PATCH', body }); },
     deleteItem(section, id) { return this.request(`/portfolio/section/${section}/item/${id}`, { method: 'DELETE' }); },
     addSocialLink(body) { return this.request('/portfolio/social-links', { method: 'POST', body }); },
     deleteSocialLink(id) { return this.request(`/portfolio/social-links/${id}`, { method: 'DELETE' }); },

     /* ── Services ── */
     getServices() { return this.request('/services'); },
     createService(body) { return this.request('/services', { method: 'POST', body }); },
     updateService(id, body) { return this.request(`/services/${id}`, { method: 'PATCH', body }); },
     deleteService(id) { return this.request(`/services/${id}`, { method: 'DELETE' }); },

     /* ── Testimonials ── */
     getTestimonials() { return this.request('/testimonials'); },
     createTestimonial(body) { return this.request('/testimonials', { method: 'POST', body }); },
     updateTestimonial(id, body) { return this.request(`/testimonials/${id}`, { method: 'PATCH', body }); },
     deleteTestimonial(id) { return this.request(`/testimonials/${id}`, { method: 'DELETE' }); },

     /* ── Contact / Messages ── */
     submitContact(body) { return this.request('/contact/submit', { method: 'POST', body }); },
     getMessages(params) { return this.request(`/contact?${params || ''}`); },
     getMessage(id) { return this.request(`/contact/${id}`); },
     toggleRead(id) { return this.request(`/contact/${id}/read`, { method: 'PATCH' }); },
     toggleStar(id) { return this.request(`/contact/${id}/star`, { method: 'PATCH' }); },
     deleteMessage(id) { return this.request(`/contact/${id}`, { method: 'DELETE' }); },
     unreadCount() { return this.request('/contact/unread-count'); },

     /* ── Uploads ── */
     uploadFile(file, fieldName = 'file') {
          const fd = new FormData();
          fd.append(fieldName, file);
          return this.request('/uploads/single', { method: 'POST', body: fd });
     },
     uploadResume(file, fieldName = 'file') {
          const fd = new FormData();
          fd.append(fieldName, file);
          return this.request('/uploads/resume', { method: 'POST', body: fd });
     },
     getResume() { return this.request('/uploads/resume'); },
     deleteUpload(idOrName) { return this.request(`/uploads/${idOrName}`, { method: 'DELETE' }); },
     /* ── Analytics ── */
     getAnalyticsSummary() { return this.request('/analytics/summary'); },
     getAnalyticsVisits(days) { return this.request(`/analytics/visits?days=${days || 30}`); },

     /* ── Health check ── */
     healthCheck() { return this.request('/health'); },
};

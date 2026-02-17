/* ═══════════════════════════════════════════════════════════════
   Auth Page Logic (admin/index.html)
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
     console.log('[Auth] Page loaded');

     // If already logged in, redirect to dashboard
     if (Api.getToken()) {
               console.log('[Auth] Token found — redirecting to dashboard');
               window.location.href = './dashboard.html';
          return;
     }

     const loginForm = document.getElementById('loginForm');
     const alertBox = document.getElementById('loginAlert');

     // ── Toggle password visibility ──
     document.querySelectorAll('.toggle-password').forEach(btn => {
          btn.addEventListener('click', () => {
               const input = document.getElementById(btn.dataset.target);
               input.type = input.type === 'password' ? 'text' : 'password';
          });
     });

     // ── Login ──
     loginForm.addEventListener('submit', async e => {
          e.preventDefault();
          const email = document.getElementById('loginEmail').value.trim();
          const password = document.getElementById('loginPassword').value;
          const btn = document.getElementById('loginBtn');

          setLoading(btn, true);
          hideAlert();

          try {
               console.log('[Auth] Attempting login for', email);
               const { data } = await Api.login({ email, password });
               Api.setToken(data.token);
               Api.setUser(data.user);
               console.log('[Auth] Login successful — redirecting');
               window.location.href = './dashboard.html';
          } catch (err) {
               console.error('[Auth] Login failed:', err.message);
               showAlert(err.message, 'error');
               setLoading(btn, false);
          }
     });

     // ── Helpers ──
     function showAlert(msg, type = 'error') {
          alertBox.textContent = msg;
          alertBox.className = `alert alert-${type}`;
          alertBox.classList.remove('hidden');
     }

     function hideAlert() {
          alertBox.classList.add('hidden');
     }

     function setLoading(btn, loading) {
          const text = btn.querySelector('.btn-text');
          const loader = btn.querySelector('.btn-loader');
          if (loading) {
               btn.disabled = true;
               text.classList.add('hidden');
               loader.classList.remove('hidden');
          } else {
               btn.disabled = false;
               text.classList.remove('hidden');
               loader.classList.add('hidden');
          }
     }
});

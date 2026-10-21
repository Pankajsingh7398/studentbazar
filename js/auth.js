/**
 * StudentBazaar — Authentication & Profile State (js/auth.js)
 */

const AuthManager = (function () {
  let currentUser = null;

  async function checkSession() {
    try {
      const res = await window.apiRequest('/auth/me');
      if (res && res.success && res.data.user) {
        currentUser = res.data.user;
        updateAuthUI();
        return currentUser;
      }
    } catch (e) {
      currentUser = null;
    }
    updateAuthUI();
    return null;
  }

  async function login(email, password) {
    const res = await window.apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res && res.success && res.data.user) {
      currentUser = res.data.user;
      if (res.data.token) {
        localStorage.setItem('sb_auth_token', res.data.token);
      }
      updateAuthUI();
      // Sync guest cart & wishlist to server
      if (window.CartManager?.syncWithServer) window.CartManager.syncWithServer();
      if (window.WishlistManager?.syncWithServer) window.WishlistManager.syncWithServer();
      return currentUser;
    }
    throw new Error(res.message || 'Login failed');
  }

  async function register(userData) {
    const res = await window.apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (res && res.success && res.data.user) {
      currentUser = res.data.user;
      if (res.data.token) {
        localStorage.setItem('sb_auth_token', res.data.token);
      }
      updateAuthUI();
      return currentUser;
    }
    throw new Error(res.message || 'Registration failed');
  }

  async function logout() {
    try {
      await window.apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    currentUser = null;
    localStorage.removeItem('sb_auth_token');
    updateAuthUI();
    window.location.reload();
  }

  function updateAuthUI() {
    const loginLinks = document.querySelectorAll('a[data-path="login"], #header-auth-link');
    const profileAvatar = document.getElementById('header-profile-avatar');

    if (currentUser) {
      loginLinks.forEach(link => {
        link.textContent = currentUser.name.split(' ')[0] || 'Scholar';
        link.href = currentUser.role === 'admin' ? '/admin/index.html' : '/pages/account.html';
        link.title = `Signed in as ${currentUser.name} (${currentUser.role})`;
      });

      if (profileAvatar) {
        profileAvatar.title = `${currentUser.name} (${currentUser.role})`;
        profileAvatar.onclick = () => {
          window.location.href = currentUser.role === 'admin' ? '/admin/index.html' : '/pages/account.html';
        };
      }
    } else {
      loginLinks.forEach(link => {
        link.textContent = 'Login / Signup';
        link.href = '/pages/login.html';
      });

      if (profileAvatar) {
        profileAvatar.title = 'Click to Sign In';
        profileAvatar.onclick = () => {
          window.location.href = '/pages/login.html';
        };
      }
    }
  }

  // Initialize session check on load
  document.addEventListener('DOMContentLoaded', () => {
    checkSession();
  });

  return {
    checkSession,
    login,
    register,
    logout,
    getUser: () => currentUser,
    isAuthenticated: () => !!currentUser,
    isAdmin: () => currentUser?.role === 'admin',
    updateAuthUI
  };
})();

window.AuthManager = AuthManager;

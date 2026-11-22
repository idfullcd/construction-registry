import { state, closeModal } from './config.js';
import { showAuthView, login, register, recoverPassword, logout } from './auth.js';
import { showApp, toggleSidebar } from './dashboard.js';

console.log('[App] Initializing...');

// Глобальные обработчики для onclick в HTML
window._showAuthView = showAuthView;
window._login = login;
window._register = register;
window._recoverPassword = recoverPassword;
window._logout = logout;
window._closeModal = closeModal;
window._toggleSidebar = toggleSidebar;

// Восстановление сессии
const saved = localStorage.getItem('currentUser');
const savedToken = localStorage.getItem('sessionToken');

console.log('[App] Saved user:', !!saved, '| Saved token:', !!savedToken);

if (saved && savedToken) {
    try {
        state.currentUser = JSON.parse(saved);
        state.sessionToken = savedToken;
        console.log('[App] Restored session for:', state.currentUser.username, '| Role:', state.currentUser.role);
        showApp();
    } catch (e) {
        console.error('[App] Failed to restore session:', e);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionToken');
        showAuthView('loginView');
    }
} else {
    console.log('[App] No saved session, showing login');
    showAuthView('loginView');
}

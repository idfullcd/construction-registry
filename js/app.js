import { state, closeModal } from './config.js';
import { showAuthView, login, register, recoverPassword, logout } from './auth.js';
import { showApp, toggleSidebar } from './dashboard.js';

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
if (saved && savedToken) {
    try {
        state.currentUser = JSON.parse(saved);
        state.sessionToken = savedToken;
        showApp();
    } catch (e) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionToken');
        showAuthView('loginView');
    }
} else {
    showAuthView('loginView');
}

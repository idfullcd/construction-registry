import { state } from './config.js';
import { showAuthView, logout } from './auth.js';
import { showApp } from './dashboard.js';

// Делаем функции доступными глобально для onclick в HTML
window.showAuthView = showAuthView;
window.login = (await import('./auth.js')).login;
window.register = (await import('./auth.js')).register;
window.recoverPassword = (await import('./auth.js')).recoverPassword;
window.logout = logout;
window.closeModal = (await import('./config.js')).closeModal;

// Проверка сессии при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        try {
            state.currentUser = JSON.parse(saved);
            showApp();
        } catch (e) {
            localStorage.removeItem('currentUser');
            showAuthView('loginView');
        }
    } else {
        showAuthView('loginView');
    }
});

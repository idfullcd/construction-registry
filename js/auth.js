import { sendRequest } from './api.js';
import { state, showMessage, setBtnLoading } from './config.js';
import { showApp } from './dashboard.js';

export function showAuthView(viewId) {
    document.querySelectorAll('.auth-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

export async function login() {
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    if (!u || !p) return showMessage('loginMessage', 'Заполните все поля');
    
    setBtnLoading('loginBtn', true, 'Войти');
    const result = await sendRequest('login', { username: u, password: p });
    setBtnLoading('loginBtn', false, 'Войти');
    
    if (result.success) {
        state.currentUser = result.user;
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        showApp();
    } else {
        showMessage('loginMessage', result.error);
    }
}

export async function register() {
    const u = document.getElementById('regUsername').value.trim();
    const p = document.getElementById('regPassword').value;
    const q = document.getElementById('regSecQuestion').value.trim();
    const a = document.getElementById('regSecAnswer').value.trim();
    if (!u || !p || !q || !a) return showMessage('regMessage', 'Заполните все поля');
    
    setBtnLoading('regBtn', true, 'Зарегистрироваться');
    const result = await sendRequest('register', {
        username: u, password: p, securityQuestion: q, securityAnswer: a
    });
    setBtnLoading('regBtn', false, 'Зарегистрироваться');
    
    if (result.success) {
        showMessage('regMessage', result.message + ' (Роль: ' + result.role + ')', false);
        setTimeout(() => showAuthView('loginView'), 1500);
    } else {
        showMessage('regMessage', result.error);
    }
}

export async function recoverPassword() {
    const u = document.getElementById('recUsername').value.trim();
    const a = document.getElementById('recSecAnswer').value.trim();
    const p = document.getElementById('recNewPassword').value;
    if (!u || !a || !p) return showMessage('recMessage', 'Заполните все поля');
    
    setBtnLoading('recBtn', true, 'Сменить пароль');
    const result = await sendRequest('recoverPassword', {
        username: u, securityAnswer: a, newPassword: p
    });
    setBtnLoading('recBtn', false, 'Сменить пароль');
    
    if (result.success) {
        showMessage('recMessage', result.message, false);
        setTimeout(() => showAuthView('loginView'), 1500);
    } else {
        showMessage('recMessage', result.error);
    }
}

export function logout() {
    if (!confirm('Выйти из системы?')) return;
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    showAuthView('loginView');
}

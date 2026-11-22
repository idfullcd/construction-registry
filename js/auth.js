import { sendRequest } from './api.js';
import { state, showMessage, setBtnLoading } from './config.js';
import { showApp } from './dashboard.js';

export function showAuthView(viewId) {
    document.querySelectorAll('.auth-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    document.querySelectorAll('.message').forEach(m => m.classList.add('hidden'));
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
        state.sessionToken = result.user.sessionToken;
        // sessionToken храним отдельно, чтобы не светить в общем объекте при ошибке
        localStorage.setItem('currentUser', JSON.stringify({
            id: result.user.id, username: result.user.username,
            role: result.user.role, customPermissions: result.user.customPermissions
        }));
        localStorage.setItem('sessionToken', state.sessionToken);
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
    if (p.length < 6) return showMessage('regMessage', 'Пароль должен быть не короче 6 символов');
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
    if (p.length < 6) return showMessage('recMessage', 'Пароль должен быть не короче 6 символов');
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

export async function logout() {
    if (!confirm('Выйти из системы?')) return;
    await sendRequest('logout', {});
    state.currentUser = null;
    state.sessionToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    showAuthView('loginView');
}

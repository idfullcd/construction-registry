/* =========================================================
   app.js  —  клиентская логика СтройРеестра
   Сборка: BUILD-2026-11-22-B
   ========================================================= */

// ЕДИНСТВЕННОЕ МЕСТО, ГДЕ ЗАДАН АДРЕС СКРИПТА
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNWo1oYzMyv332prE-QSbyYbu5HISdKN4MhXe6XFh9S6H9PCvJVMIPMXxp1yW8UAYS4w/exec";
const BUILD = "BUILD-2026-11-22-B";

const $ = id => document.getElementById(id);
let currentUser = null;

// Показываем номер сборки и URL, чтобы сразу видеть, обновился ли файл
window.addEventListener('load', () => {
  const dbg = $('debug');
  if (dbg) dbg.innerHTML = 'Сборка: <b>' + BUILD + '</b><br>API: ' + SCRIPT_URL;

  if (!validUrl()) {
    msg('login-message', 'ОШИБКА КОНФИГУРАЦИИ: неверный SCRIPT_URL в app.js');
    return;
  }

  const saved = localStorage.getItem('currentUser');
  if (saved) {
    try { currentUser = JSON.parse(saved); renderMain(); }
    catch (e) { localStorage.removeItem('currentUser'); }
  }
});

function validUrl() {
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_\-]+\/exec$/.test(SCRIPT_URL);
}

async function api(action, data = {}) {
  if (!validUrl()) {
    return { success: false, message: 'НЕВЕРНЫЙ АДРЕС СКРИПТА: "' + SCRIPT_URL + '". Замените SCRIPT_URL в app.js.' };
  }
  let res, text;
  try {
    res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // обход CORS preflight
      body: JSON.stringify(Object.assign({ action }, data)),
      redirect: 'follow'
    });
    text = await res.text();
  } catch (e) {
    return { success: false, message: 'Сеть недоступна: ' + e.message };
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      success: false,
      message: 'Сервер вернул не JSON (HTTP ' + res.status + '). Проверьте деплой Apps Script: доступ должен быть «Все». Начало ответа: ' + text.slice(0, 120)
    };
  }
}

function msg(id, text, ok = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.className = ok ? 'success' : 'error';
}

function show(section) {
  ['auth-section', 'register-section', 'main-section'].forEach(s => {
    const el = $(s); if (el) el.classList.add('hidden');
  });
  $(section).classList.remove('hidden');
}

// Навешиваем обработчики после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  $('link-reg').onclick   = e => { e.preventDefault(); msg('login-message', ''); show('register-section'); };
  $('link-login').onclick = e => { e.preventDefault(); msg('reg-message', '');   show('auth-section'); };
  $('btn-login').onclick  = login;
  $('btn-reg').onclick    = register;
  $('btn-logout').onclick = logout;
  $('btn-refresh').onclick = loadUsers;

  $('users-tbody').addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.act !== 'role') return;
    const r = await api('changeRole', {
      targetUsername: el.dataset.user,
      newRole: el.value,
      adminUsername: currentUser.username
    });
    if (!r.success) alert(r.message);
    loadUsers();
  });

  $('users-tbody').addEventListener('click', async e => {
    const el = e.target;
    if (el.dataset.act !== 'del') return;
    if (!confirm('Безвозвратно удалить пользователя "' + el.dataset.user + '"?')) return;
    const r = await api('deleteUser', {
      targetUsername: el.dataset.user,
      adminUsername: currentUser.username
    });
    if (!r.success) alert(r.message);
    loadUsers();
  });
});

async function register() {
  const username = $('reg-username').value.trim();
  const password = $('reg-password').value;
  if (!username || !password) return msg('reg-message', 'Заполните все поля');
  msg('reg-message', 'Регистрация…', true);
  const r = await api('register', { username, password });
  if (r.success) {
    msg('reg-message', r.message, true);
    setTimeout(() => { show('auth-section'); msg('login-message', 'Теперь войдите', true); }, 1200);
  } else msg('reg-message', r.message);
}

async function login() {
  const username = $('login-username').value.trim();
  const password = $('login-password').value;
  if (!username || !password) return msg('login-message', 'Заполните все поля');
  msg('login-message', 'Вход…', true);
  const r = await api('login', { username, password });
  if (r.success) {
    currentUser = r.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    msg('login-message', '');
    renderMain();
  } else msg('login-message', r.message);
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  $('login-password').value = '';
  show('auth-section');
}

function renderMain() {
  show('main-section');
  $('current-user').textContent = currentUser.username;
  $('current-role').textContent = currentUser.role;
  $('current-role').className = 'badge role-' + currentUser.role;
  if (currentUser.role === 'admin') {
    $('admin-panel').classList.remove('hidden');
    loadUsers();
  } else {
    $('admin-panel').classList.add('hidden');
  }
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadUsers() {
  const tb = $('users-tbody');
  tb.innerHTML = '<tr><td colspan="3">Загрузка…</td></tr>';
  const r = await api('getUsers', { adminUsername: currentUser.username });
  if (!r.success) { tb.innerHTML = ''; return msg('admin-message', r.message); }
  msg('admin-message', '');
  tb.innerHTML = r.users.map(u => {
    const self = u.username === currentUser.username;
    const opt = (v, l) => `<option value="${v}" ${u.role === v ? 'selected' : ''}>${l}</option>`;
    return `<tr>
      <td>${esc(u.username)}${self ? ' <i>(вы)</i>' : ''}</td>
      <td><span class="badge role-${esc(u.role)}">${esc(u.role)}</span></td>
      <td>
        <select data-act="role" data-user="${esc(u.username)}" ${self ? 'disabled' : ''} style="width:auto;display:inline-block;padding:6px">
          ${opt('user', 'user')}${opt('moderator', 'moderator')}${opt('admin', 'admin')}
        </select>
        <button class="btn-danger" data-act="del" data-user="${esc(u.username)}" ${self ? 'disabled' : ''}>Удалить</button>
      </td></tr>`;
  }).join('');
}

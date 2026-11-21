// ФАЙЛ: app.js
// Версия: FINAL-WITH-RECOVERY

// ⚠️ ВСТАВЬТЕ СЮДА ВАШУ РАБОЧУЮ ССЫЛКУ ИЗ GOOGLE APPS SCRIPT ⚠️
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQFSn0PCJ6ffyf3_rTb1jq1LpSilORYVqlW_SZtMHb_7wYHnl3cYQjJCaGoYWuJfgFDg/exec";

const $ = id => document.getElementById(id);
let currentUser = null;
let recoverUsername = null;

window.addEventListener('load', () => {
  const dbg = $('debug');
  if (dbg) dbg.innerHTML = 'Сборка: <b>FINAL-WITH-RECOVERY</b><br>API: ' + SCRIPT_URL;
  
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    try { currentUser = JSON.parse(saved); renderMain(); }
    catch (e) { localStorage.removeItem('currentUser'); }
  }
});

async function api(action, data = {}) {
  const payload = { action, ...data };
  const url = SCRIPT_URL + '?t=' + Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Сервер вернул не JSON:", text);
      return { success: false, message: 'Ошибка сервера. Ответ: ' + text.substring(0, 200) };
    }
  } catch (error) {
    return { success: false, message: 'Ошибка сети: ' + error.message };
  }
}

function msg(id, text, ok = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.className = ok ? 'success' : 'error';
}

function show(section) {
  ['auth-section', 'register-section', 'recover-section', 'main-section'].forEach(s => {
    const el = $(s); if (el) el.classList.add('hidden');
  });
  $(section).classList.remove('hidden');
}

function showRecoverStep(step) {
  $('recover-step1').classList.add('hidden');
  $('recover-step2').classList.add('hidden');
  $(step).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // Навигация
  $('link-reg').onclick   = e => { e.preventDefault(); msg('login-message', ''); show('register-section'); };
  $('link-recover').onclick = e => { e.preventDefault(); msg('login-message', ''); show('recover-section'); showRecoverStep('recover-step1'); };
  $('link-login-from-reg').onclick = e => { e.preventDefault(); msg('reg-message', ''); show('auth-section'); };
  $('link-login-from-recover').onclick = e => { e.preventDefault(); msg('recover-message', ''); show('auth-section'); };
  $('link-login-from-recover2').onclick = e => { e.preventDefault(); msg('recover-message2', ''); show('auth-section'); };
  
  // Кнопки
  $('btn-login').onclick = login;
  $('btn-reg').onclick = register;
  $('btn-logout').onclick = logout;
  $('btn-refresh').onclick = loadUsers;
  $('btn-recover-next').onclick = recoverStep1;
  $('btn-recover-submit').onclick = recoverStep2;

  // Делегирование событий для таблицы пользователей
  $('users-tbody').addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.act !== 'role') return;
    const r = await api('changeRole', { targetUsername: el.dataset.user, newRole: el.value, adminUsername: currentUser.username });
    if (!r.success) alert(r.message); else loadUsers();
  });

  $('users-tbody').addEventListener('click', async e => {
    const el = e.target;
    if (el.dataset.act === 'del') {
      if (!confirm('Безвозвратно удалить пользователя "' + el.dataset.user + '"?')) return;
      const r = await api('deleteUser', { targetUsername: el.dataset.user, adminUsername: currentUser.username });
      if (!r.success) alert(r.message); else loadUsers();
    }
    if (el.dataset.act === 'reset') {
      if (!confirm('Сбросить пароль пользователю "' + el.dataset.user + '"? Ему будет выдан временный пароль.')) return;
      const r = await api('resetPasswordByAdmin', { targetUsername: el.dataset.user, adminUsername: currentUser.username });
      alert(r.message);
    }
  });
});

// ========== РЕГИСТРАЦИЯ ==========
async function register() {
  const username = $('reg-username').value.trim();
  const password = $('reg-password').value;
  const question = $('reg-question').value;
  const answer = $('reg-answer').value.trim();
  
  if (!username || !password || !question || !answer) {
    return msg('reg-message', 'Заполните все поля, включая секретный вопрос');
  }
  if (password.length < 4) return msg('reg-message', 'Пароль должен быть не короче 4 символов');
  
  msg('reg-message', 'Регистрация…', true);
  const r = await api('register', { username, password, secretQuestion: question, secretAnswer: answer });
  if (r.success) {
    msg('reg-message', r.message, true);
    setTimeout(() => { show('auth-section'); msg('login-message', 'Теперь войдите', true); }, 1500);
  } else msg('reg-message', r.message);
}

// ========== ВХОД ==========
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

// ========== ВОССТАНОВЛЕНИЕ ПАРОЛЯ ==========
async function recoverStep1() {
  const username = $('recover-username').value.trim();
  if (!username) return msg('recover-message', 'Введите имя пользователя');
  
  msg('recover-message', 'Поиск…', true);
  const r = await api('getSecretQuestion', { username });
  if (r.success) {
    recoverUsername = username;
    $('recover-question').textContent = r.question;
    showRecoverStep('recover-step2');
  } else {
    msg('recover-message', r.message);
  }
}

async function recoverStep2() {
  const answer = $('recover-answer').value.trim();
  const newPass = $('recover-newpass').value;
  
  if (!answer || !newPass) return msg('recover-message2', 'Заполните все поля');
  if (newPass.length < 4) return msg('recover-message2', 'Пароль должен быть не короче 4 символов');
  
  msg('recover-message2', 'Смена пароля…', true);
  const r = await api('recoverPassword', { 
    username: recoverUsername, 
    secretAnswer: answer, 
    newPassword: newPass 
  });
  
  if (r.success) {
    msg('recover-message2', r.message, true);
    setTimeout(() => { 
      show('auth-section'); 
      msg('login-message', 'Пароль изменён. Войдите с новым паролем.', true); 
    }, 2000);
  } else {
    msg('recover-message2', r.message);
  }
}

// ========== АДМИН-ПАНЕЛЬ ==========
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadUsers() {
  const tb = $('users-tbody');
  tb.innerHTML = '<tr><td colspan="3">Загрузка…</td></tr>';
  const r = await api('getUsers', { adminUsername: currentUser.username });
  
  if (!r.success) { 
    tb.innerHTML = ''; 
    return msg('admin-message', r.message); 
  }
  
  msg('admin-message', '');
  
  // Фильтруем массив, убирая пустые или некорректные строки
  const validUsers = r.users.filter(u => u && u.username && u.role);
  
  if (validUsers.length === 0) {
    tb.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888">Нет пользователей</td></tr>';
    return;
  }
  
  tb.innerHTML = validUsers.map(u => {
    const self = u.username === currentUser.username;
    const opt = (v, l) => `<option value="${v}" ${u.role === v ? 'selected' : ''}>${l}</option>`;
    return `<tr>
      <td>${esc(u.username)}${self ? ' <i>(вы)</i>' : ''}</td>
      <td><span class="badge role-${esc(u.role)}">${esc(u.role)}</span></td>
      <td>
        <select data-act="role" data-user="${esc(u.username)}" ${self ? 'disabled' : ''} style="width:auto;display:inline-block;padding:6px">
          ${opt('user', 'user')}${opt('moderator', 'moderator')}${opt('admin', 'admin')}
        </select>
        <button class="btn-warning" data-act="reset" data-user="${esc(u.username)}" ${self ? 'disabled' : ''} title="Сбросить пароль">🔑 Сброс</button>
        <button class="btn-danger" data-act="del" data-user="${esc(u.username)}" ${self ? 'disabled' : ''}>Удалить</button>
      </td></tr>`;
  }).join('');
}

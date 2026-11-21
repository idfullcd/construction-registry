// ⚠️ ВАЖНО: Замените на ваш URL из Apps Script (должен заканчиваться на /exec)
const API_URL = 'https://script.google.com/macros/s/AKfycbw7mLMaEQs_GVNu6X02vnKsi0MvsGnllZMC2trvVx_jDAr8Sn-b-D0iV_1vYRTj6PIbJw/exec';

let currentUser = null;
let allData = {};

// ==========================================
// API
// ==========================================
async function api(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: currentUser?.token, ...payload })
    });
    const result = await response.json();
    if (result.success === false) throw new Error(result.error || 'Ошибка');
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==========================================
// АВТОРИЗАЦИЯ
// ==========================================
async function login() {
  const loginVal = document.getElementById('loginInput').value.trim();
  const passwordVal = document.getElementById('passwordInput').value;
  const err = document.getElementById('loginError');
  
  if (!loginVal || !passwordVal) {
    err.textContent = 'Введите логин и пароль';
    return;
  }
  
  err.textContent = 'Проверка...';
  err.style.color = 'var(--info)';
  
  try {
    const result = await api('login', { login: loginVal, password: passwordVal });
    if (result.success) {
      currentUser = result.user;
      currentUser.token = result.token;
      // Сохраняем сессию на 6 часов
      localStorage.setItem('session', JSON.stringify({
        user: currentUser,
        expires: Date.now() + 6 * 60 * 60 * 1000
      }));
      showMainScreen();
    } else {
      err.textContent = result.error || 'Неверный логин или пароль';
      err.style.color = 'var(--danger)';
    }
  } catch (error) {
    err.textContent = error.message;
    err.style.color = 'var(--danger)';
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('session');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('mainScreen').style.display = 'none';
  document.getElementById('loginInput').value = '';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginError').textContent = '';
}

function showMainScreen() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.fio;
  document.getElementById('userRole').textContent = currentUser.role;
  loadData();
}

// Проверка сессии при загрузке
window.onload = () => {
  const saved = localStorage.getItem('session');
  if (saved) {
    try {
      const session = JSON.parse(saved);
      if (session.expires > Date.now()) {
        currentUser = session.user;
        showMainScreen();
        return;
      }
    } catch (e) {}
    localStorage.removeItem('session');
  }
  document.getElementById('loginScreen').style.display = 'flex';
};

// Вход по Enter
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('passwordInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});

// ==========================================
// ВКЛАДКИ
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
}

// ==========================================
// ЗАГРУЗКА ДАННЫХ
// ==========================================
async function loadData() {
  try {
    const result = await fetch(API_URL + '?token=' + encodeURIComponent(currentUser.token));
    const data = await result.json();
    if (!data.ok) throw new Error(data.error || 'Ошибка загрузки');
    allData = data.data;
    renderUsers();
    renderJournal();
    renderHistory();
    renderTrash();
  } catch (error) {
    toast(error.message, 'error');
  }
}

// ==========================================
// ПОЛЬЗОВАТЕЛИ
// ==========================================
function renderUsers() {
  const search = document.getElementById('userSearch').value.toLowerCase();
  let users = allData.users || [];
  if (search) {
    users = users.filter(u => 
      u['Логин'].toLowerCase().includes(search) ||
      u['ФИО'].toLowerCase().includes(search) ||
      u['Роль'].toLowerCase().includes(search)
    );
  }
  
  const list = document.getElementById('usersList');
  if (!users.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">👥</div><p>Пользователи не найдены</p></div>';
    return;
  }
  
  list.innerHTML = `<div class="table-wrap"><table>
    <thead><tr>
      <th>Логин</th>
      <th>ФИО</th>
      <th>Роль</th>
      <th>Email</th>
      <th>Действия</th>
    </tr></thead>
    <tbody>
      ${users.map(u => `<tr>
        <td><b>${u['Логин']}</b></td>
        <td>${u['ФИО']}</td>
        <td><span class="badge badge-info">${u['Роль']}</span></td>
        <td>${u['Email'] || '—'}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="openUserModal('${u['Логин']}')">✎</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUser('${u['Логин']}')" ${u['Логин'] === currentUser.login ? 'disabled' : ''}>🗑️</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function openUserModal(login = null) {
  const user = login ? (allData.users || []).find(u => u['Логин'] === login) : null;
  const isEdit = !!user;
  
  document.getElementById('modalBody').innerHTML = `
    <h2>${isEdit ? '✎ Редактировать' : '➕ Новый'} пользователь</h2>
    <div class="form-group">
      <label>Логин *</label>
      <input type="text" id="uLogin" value="${user ? user['Логин'] : ''}" ${isEdit ? 'readonly' : ''}>
    </div>
    <div class="form-group">
      <label>${isEdit ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль *'}</label>
      <input type="text" id="uPass" placeholder="${isEdit ? 'Не менять' : 'Минимум 8 символов'}">
    </div>
    <div class="form-group">
      <label>ФИО *</label>
      <input type="text" id="uFio" value="${user ? user['ФИО'] : ''}">
    </div>
    <div class="form-group">
      <label>Роль</label>
      <select id="uRole">
        ${['Администратор','ПТО','Бухгалтерия','Прораб','Архитектор','Дизайнер','ГАП','ГИП','Тендерный_специалист','Отдел_кадров','Снабжение']
          .map(r => `<option ${user && user['Роль'] === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="uEmail" value="${user ? user['Email'] || '' : ''}">
    </div>
    <button class="btn btn-primary btn-full" onclick="saveUser(${isEdit})">${isEdit ? 'Сохранить' : 'Создать'}</button>
  `;
  
  document.getElementById('userModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('userModal').style.display = 'none';
}

async function saveUser(isEdit) {
  const login = document.getElementById('uLogin').value.trim();
  const password = document.getElementById('uPass').value;
  const fio = document.getElementById('uFio').value.trim();
  const role = document.getElementById('uRole').value;
  const email = document.getElementById('uEmail').value.trim();
  
  if (!login || !fio) {
    toast('Заполните логин и ФИО', 'error');
    return;
  }
  
  if (!isEdit && password.length < 8) {
    toast('Пароль минимум 8 символов', 'error');
    return;
  }
  
  try {
    await api(isEdit ? 'updateUser' : 'createUser', {
      login, password, fio, role, email
    });
    closeModal();
    toast(isEdit ? 'Пользователь обновлён' : 'Пользователь создан', 'success');
    loadData();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function deleteUser(login) {
  if (!confirm(`Удалить пользователя ${login}?`)) return;
  try {
    await api('deleteUser', { login });
    toast('Пользователь удалён', 'success');
    loadData();
  } catch (error) {
    toast(error.message, 'error');
  }
}

// ==========================================
// ЖУРНАЛ
// ==========================================
function renderJournal() {
  const rows = allData.journal || [];
  const list = document.getElementById('journalList');
  
  if (!rows.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">📜</div><p>Журнал пуст</p></div>';
    return;
  }
  
  list.innerHTML = `<div class="table-wrap"><table>
    <thead><tr>
      <th>Дата</th>
      <th>Пользователь</th>
      <th>Действие</th>
      <th>Объект</th>
      <th>Детали</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `<tr>
        <td>${r['Дата']}</td>
        <td>${r['Пользователь']}</td>
        <td><b>${r['Действие']}</b></td>
        <td>${r['Объект']}</td>
        <td>${r['Детали'] || ''}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

// ==========================================
// ИСТОРИЯ
// ==========================================
function renderHistory() {
  const rows = allData.history || [];
  const list = document.getElementById('historyList');
  
  if (!rows.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">🕘</div><p>История пуста</p></div>';
    return;
  }
  
  list.innerHTML = `<div class="table-wrap"><table>
    <thead><tr>
      <th>Дата</th>
      <th>Пользователь</th>
      <th>Действие</th>
      <th>Сущность</th>
      <th>ID записи</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `<tr>
        <td>${r['Дата']}</td>
        <td>${r['Пользователь']}</td>
        <td><b>${r['Действие']}</b></td>
        <td>${r['Сущность']}</td>
        <td>${r['ID_записи']}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

// ==========================================
// КОРЗИНА
// ==========================================
function renderTrash() {
  const trash = allData.trash || {};
  const list = document.getElementById('trashList');
  
  const keys = Object.keys(trash).filter(k => trash[k].length);
  if (!keys.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">🗑️</div><p>Корзина пуста</p></div>';
    return;
  }
  
  list.innerHTML = keys.map(module => {
    const items = trash[module];
    return `<div class="card">
      <h3>${module} (${items.length})</h3>
      <div class="table-wrap" style="margin-top:10px;"><table>
        <thead><tr>
          <th>ID</th>
          <th>Название</th>
          <th>Действия</th>
        </tr></thead>
        <tbody>
          ${items.map(item => `<tr>
            <td>${item.id}</td>
            <td>${item.title}</td>
            <td>
              <button class="btn btn-success btn-sm" onclick="restoreItem('${module}', '${item.id}')">✅ Восстановить</button>
              <button class="btn btn-danger btn-sm" onclick="purgeItem('${module}', '${item.id}')">🗑️ Навсегда</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  }).join('');
}

async function restoreItem(module, id) {
  try {
    await api('restoreUser', { login: id });
    toast('Восстановлено', 'success');
    loadData();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function purgeItem(module, id) {
  if (!confirm('Удалить навсегда? Это действие нельзя отменить!')) return;
  try {
    await api('purgeUser', { login: id });
    toast('Удалено навсегда', 'success');
    loadData();
  } catch (error) {
    toast(error.message, 'error');
  }
}

// ==========================================
// НАСТРОЙКИ
// ==========================================
async function createBackup() {
  toast('Создаю резервную копию...', 'info');
  try {
    const result = await api('createBackup');
    toast(`Копия создана: ${result.fileName}`, 'success');
    window.open(result.fileUrl, '_blank');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function installTriggers() {
  try {
    await api('installTriggers');
    toast('Триггеры установлены: бэкап ежедневно в 23:00', 'success');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function saveSettings() {
  const sender = document.getElementById('setSender').value;
  try {
    await api('saveSettings', {
      items: {
        'Email_Sender_Name': sender
      }
    });
    toast('Настройки сохранены', 'success');
  } catch (error) {
    toast(error.message, 'error');
  }
}

// ==========================================
// ТОСТЫ
// ==========================================
function toast(message, type = 'info') {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

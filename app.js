// ⚠️ ВАЖНО: ВСТАВЬТЕ СЮДА ВАШ URL ИЗ GOOGLE APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycby2nmHHno75n8MTfPFtjg85H3C4C99LGaBqoCAY0g1TDk6g35NZDXGOQfXXccE4kfqbQg/exec';

let currentUser = null;
let allData = {};

// ==========================================
// API ЗАПРОСЫ (С ИСПРАВЛЕНИЕМ CORS)
// ==========================================
async function api(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ CORS: используем text/plain
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, userLogin: currentUser?.login, ...payload })
    });
    if (!response.ok) {
      throw new Error(`HTTP ошибка: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Не удалось соединиться с сервером. Проверьте VPN или правильность API_URL.');
  }
}

// ==========================================
// АВТОРИЗАЦИЯ
// ==========================================
async function login() {
  const loginVal = document.getElementById('loginInput').value.trim();
  const passwordVal = document.getElementById('passwordInput').value.trim();
  const err = document.getElementById('loginError');
  err.textContent = 'Проверка...';
  err.style.color = 'blue';

  try {
    const result = await api('login', { login: loginVal, password: passwordVal });
    if (result.success) {
      currentUser = result.user;
      localStorage.setItem('user', JSON.stringify(currentUser));
      showMainScreen();
    } else {
      err.textContent = result.error || 'Неверный логин или пароль';
      err.style.color = 'red';
    }
  } catch (error) {
    err.textContent = error.message;
    err.style.color = 'red';
  }
}

function logout() {
  currentUser = null;
  allData = {};
  localStorage.removeItem('user');
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
  buildTabs();
  loadData();
}

window.onload = () => {
  const saved = localStorage.getItem('user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showMainScreen();
    } catch (e) {
      localStorage.removeItem('user');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') login();
    });
  }
});

// ==========================================
// ВКЛАДКИ
// ==========================================
const TABS = [
  ['contracts', '📋 Договоры'],
  ['submissions', '📝 Подачи'],
  ['ks2', '💰 КС-2'],
  ['estimates', '📊 Сметы'],
  ['tenders', '📝 Тендеры'],
  ['contractors', '🏢 Подрядчики'],
  ['personnel', '👥 Персонал'],
  ['tasks', '📨 Задания'],
  ['materials', '📦 Материалы'],
  ['reminders', '⏰ Напоминания'],
  ['dashboard', '📈 Дашборд'],
  ['actions', '📜 Журнал'],
  ['trash', '🗑️ Корзина'],
  ['history', '📜 История'],
  ['admin', '⚙️ Админ']
];

function buildTabs() {
  const container = document.getElementById('tabs');
  if (!container) return;
  container.innerHTML = '';
  TABS.forEach(([id, label], idx) => {
    const hidden = (id === 'admin' && currentUser?.role !== 'Администратор');
    container.innerHTML += `<div class="tab ${idx === 0 ? 'active' : ''}" data-tab="${id}" onclick="switchTabDirect('${id}')" style="${hidden ? 'display:none;' : ''}">${label}</div>`;
  });
}

function switchTabDirect(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const tabEl = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (tabEl) tabEl.classList.add('active');
  const contentEl = document.getElementById('tab-' + tabId);
  if (contentEl) contentEl.classList.add('active');
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'trash') loadTrash();
  if (tabId === 'history') loadHistory();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function openModalHtml(html) {
  document.getElementById('universalModalBody').innerHTML = html;
  document.getElementById('universalModal').style.display = 'block';
}

// ==========================================
// УТИЛИТЫ
// ==========================================
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
function money(v) { return Number(v || 0).toLocaleString('ru-RU') + ' ₽'; }
function fileLink(url, label = '📄 Открыть') { return url ? `<a class="btn btn-small btn-info" href="${url}" target="_blank">${label}</a>` : ''; }
function driveDownload(fileId) { return fileId ? `<a class="btn btn-small btn-success" href="https://drive.google.com/uc?export=download&id=${fileId}" target="_blank">⬇️</a>` : ''; }

// ==========================================
// ЗАГРУЗКА ДАННЫХ
// ==========================================
async function loadData(silent = false) {
  if (!silent) {
    const list = document.getElementById('contractsList');
    if (list) list.innerHTML = '<div class="loader">Загрузка...</div>';
  }
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    allData = data;
    renderContracts();
    renderSubmissions();
    renderKS2List();
    renderTenders();
    renderPersonnel();
    renderTasks();
    renderEstimatesList();
    renderContractors();
    renderMaterials();
    renderReminders();
    renderDashboard();
    renderActions();
    renderUsers();
    const stats = document.getElementById('contractsStats');
    if (stats) {
      stats.innerHTML = `
        <div class="stat-box"><div class="stat-number">${(allData.contracts || []).length}</div><div class="stat-label">Договоров</div></div>
        <div class="stat-box"><div class="stat-number">${(allData.documents || []).length}</div><div class="stat-label">Документов</div></div>
        <div class="stat-box"><div class="stat-number">${(allData.submissions || []).filter(s => s['Статус'] === 'На_проверке').length}</div><div class="stat-label">На проверке</div></div>
        <div class="stat-box"><div class="stat-number">${(allData.tenders || []).length}</div><div class="stat-label">Тендеров</div></div>
      `;
    }
  } catch (e) {
    console.error('Load error:', e);
    if (!silent) {
      const list = document.getElementById('contractsList');
      if (list) list.innerHTML = `<div class="error">Ошибка загрузки: ${e.message}</div>`;
    }
  }
}

// ==========================================
// РЕНДЕРИНГ МОДУЛЕЙ
// ==========================================
function renderContracts() {
  const search = val('contractSearch').toLowerCase();
  let contracts = allData.contracts || [];
  if (search) contracts = contracts.filter(c => String(c['Контрагент'] || '').toLowerCase().includes(search) || String(c['Номер_Договора'] || '').toLowerCase().includes(search));
  const list = document.getElementById('contractsList');
  if (!list) return;
  if (contracts.length === 0) { list.innerHTML = '<div class="loader">Договоры не найдены</div>'; return; }
  list.innerHTML = contracts.map(c => {
    const docs = (allData.documents || []).filter(d => d['ID_Договора'] === c['ID_Договора']);
    return `<div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${c['Иконка'] || '🏢'} ${c['Контрагент']} <span class="badge badge-info">${c['ID_Договора']}</span></div>
          <div class="card-meta">№${c['Номер_Договора']} от ${c['Дата_Договора']} | ${c['Предмет']} | ${money(c['Сумма'])} | Отв: ${c['Ответственный']}</div>
          <div class="card-meta">Документов: ${docs.length}</div>
        </div>
        <div>
          <button class="btn btn-small btn-success" onclick="openUploadDocModal('${c['ID_Договора']}')">📤 Документ</button>
          ${fileLink(c['Ссылка_на_папку'], '📁 Папка')}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderSubmissions() {
  const filter = val('submissionFilter');
  let rows = allData.submissions || [];
  if (filter) rows = rows.filter(r => r['Статус'] === filter);
  const list = document.getElementById('submissionsList');
  if (!list) return;
  list.innerHTML = rows.map(r => {
    const pos = (allData.estimateItems || []).find(p => p['ID_Позиции'] === r['ID_Позиции']);
    return `<div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${pos ? pos['Наименование'] : r['ID_Позиции']}</div>
          <div class="card-meta">Подал: ${r['Кто_подал']} | ${r['Дата_подачи']}<br>Объём: <b>${r['Объём_подан']}</b></div>
        </div>
        <div>
          <span class="badge ${r['Статус'] === 'На_проверке' ? 'badge-warning' : r['Статус'] === 'Подтверждено' ? 'badge-success' : 'badge-danger'}">${r['Статус']}</span>
        </div>
      </div>
    </div>`;
  }).join('') || '<div class="loader">Подач нет</div>';
}

function renderKS2List() {
  let rows = allData.ks2Registry || [];
  const list = document.getElementById('ks2List');
  if (!list) return;
  list.innerHTML = rows.map(r => `<div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">КС-2 №${r['Номер_КС2']}</div>
        <div class="card-meta">Дата: ${r['Дата_составления']} | Сумма: <b>${money(r['Общая_сумма'])}</b></div>
      </div>
      <div>
        <span class="badge badge-info">${r['Статус']}</span>
        <button class="btn btn-small btn-danger" onclick="deleteKS2('${r['ID']}')">🗑️</button>
      </div>
    </div>
  </div>`).join('') || '<div class="loader">КС-2 нет</div>';
}

function renderTenders() {
  let rows = allData.tenders || [];
  const list = document.getElementById('tendersList');
  if (!list) return;
  list.innerHTML = rows.map(r => `<div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${r['Название']}</div>
        <div class="card-meta">${r['Заказчик']} | Наша цена: ${money(r['Наша_цена'])}</div>
      </div>
      <div>
        <span class="badge badge-info">${r['Статус']}</span>
        <button class="btn btn-small btn-danger" onclick="deleteTender('${r['ID']}')">🗑️</button>
      </div>
    </div>
  </div>`).join('') || '<div class="loader">Тендеров нет</div>';
}

function renderPersonnel() {
  const search = val('personnelSearch').toLowerCase();
  let rows = allData.personnel || [];
  if (search) rows = rows.filter(r => String(r['ФИО'] || '').toLowerCase().includes(search));
  const list = document.getElementById('personnelList');
  if (!list) return;
  list.innerHTML = rows.map(r => {
    const initials = String(r['ФИО'] || '?').split(' ').map(x => x[0]).join('').slice(0, 2);
    return `<div class="card">
      <div class="card-header">
        <div style="display:flex; gap:14px; align-items:center;">
          <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #ff6b35, #f7931e); display:flex; align-items:center; justify-content:center; color:white; font-size:22px; font-weight:700;">${initials}</div>
          <div>
            <div class="card-title">${r['ФИО']}</div>
            <div class="card-meta">${r['Должность']} | ${r['Телефон'] || '—'}</div>
          </div>
        </div>
        <div>
          <button class="btn btn-small btn-danger" onclick="deletePerson('${r['ID']}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('') || '<div class="loader">Сотрудников нет</div>';
}

function renderTasks() {
  const filter = val('taskFilter');
  let tasks = allData.tasks || [];
  if (filter === 'incoming') tasks = tasks.filter(t => t['Кому'] === currentUser.login);
  else if (filter === 'outgoing') tasks = tasks.filter(t => t['От_кого'] === currentUser.login);
  const el = document.getElementById('tasksList');
  if (!el) return;
  if (tasks.length === 0) { el.innerHTML = '<div class="loader">Заданий нет</div>'; return; }
  el.innerHTML = tasks.map(t => `<div class="card" style="cursor:pointer;" onclick="viewTask('${t['ID']}')">
    <div class="card-header">
      <div>
        <div class="card-title">${t['Тема']} <span class="badge badge-info">${t['Приоритет']}</span></div>
        <div class="card-meta">От: ${t['От_кого']} → Кому: ${t['Кому']}<br>Дедлайн: ${t['Дедлайн'] || '—'}</div>
      </div>
      <span class="badge badge-${t['Статус'] === 'Выполнено' ? 'success' : 'warning'}">${t['Статус']}</span>
    </div>
  </div>`).join('');
}

function renderEstimatesList() {
  let rows = allData.estimates || [];
  const el = document.getElementById('estimatesList');
  if (!el) return;
  el.innerHTML = rows.map(r => `<div class="card" style="border-left-color:#8b5cf6;">
    <div class="card-header">
      <div>
        <div class="card-title">📊 ${r['Название']}</div>
        <div class="card-meta">💰 ${money(r['Общая_сумма'])}</div>
      </div>
      <div>
        <button class="btn btn-small btn-danger" onclick="deleteEstimate('${r['ID_Сметы']}')">🗑️</button>
      </div>
    </div>
  </div>`).join('') || '<div class="loader">Смет нет</div>';
}

function renderContractors() {
  let rows = allData.contractors || [];
  const el = document.getElementById('contractorsList');
  if (!el) return;
  el.innerHTML = rows.map(r => `<div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">🏢 ${r['Название']}</div>
        <div class="card-meta">ИНН: ${r['ИНН'] || '—'} | 👤 ${r['Контактное_лицо'] || '—'}</div>
      </div>
      <div>
        <button class="btn btn-small btn-info" onclick="viewContractor('${r['ID']}')">👁️ Обзор</button>
        <button class="btn btn-small btn-danger" onclick="deleteContractor('${r['ID']}')">🗑️</button>
      </div>
    </div>
  </div>`).join('') || '<div class="loader">Подрядчиков нет</div>';
}

function renderMaterials() {
  let rows = allData.materials || [];
  const el = document.getElementById('materialsList');
  if (!el) return;
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Наименование</th><th>Поставщик</th><th>Количество</th><th>Статус</th><th>Действия</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${r['Наименование']}</td>
      <td>${r['Поставщик']}</td>
      <td>${r['Количество']} ${r['Ед.изм']}</td>
      <td><span class="badge badge-info">${r['Статус']}</span></td>
      <td><button class="btn btn-small btn-danger" onclick="deleteMaterial('${r['ID']}')">🗑️</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderReminders() {
  let rows = allData.reminders || [];
  const el = document.getElementById('remindersList');
  if (!el) return;
  el.innerHTML = rows.map(r => `<div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${r['Тип']} — ${r['Объект']}</div>
        <div class="card-meta">📅 ${r['Дата']} | 👤 ${r['Ответственный']}</div>
      </div>
      <div>
        <span class="badge badge-${r['Статус'] === 'Выполнено' ? 'success' : 'warning'}">${r['Статус']}</span>
        <button class="btn btn-small btn-danger" onclick="deleteReminder('${r['ID']}')">🗑️</button>
      </div>
    </div>
  </div>`).join('') || '<div class="loader">Напоминаний нет</div>';
}

function renderDashboard() {
  const stats = document.getElementById('dashboardStats');
  if (stats) {
    stats.innerHTML = `
      <div class="stat-box"><div class="stat-number">${(allData.contracts || []).length}</div><div class="stat-label">Договоров</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.documents || []).length}</div><div class="stat-label">Документов</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.tenders || []).length}</div><div class="stat-label">Тендеров</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.personnel || []).length}</div><div class="stat-label">Сотрудников</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.ks2Registry || []).length}</div><div class="stat-label">КС-2</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.tasks || []).length}</div><div class="stat-label">Заданий</div></div>
    `;
  }
}

function renderActions() {
  const rows = (allData.actions || []).slice().reverse().slice(0, 200);
  const el = document.getElementById('actionsList');
  if (!el) return;
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${r['Дата']}</td>
      <td>${r['Пользователь']}</td>
      <td>${r['Действие']}</td>
      <td>${r['Объект']}</td>
      <td>${r['Детали'] || ''}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderUsers() {
  const el = document.getElementById('usersList');
  if (!el) return;
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Логин</th><th>ФИО</th><th>Роль</th><th>Email</th><th>Действия</th></tr></thead>
    <tbody>${(allData.users || []).map(u => `<tr>
      <td>${u['Логин']}</td>
      <td>${u['ФИО']}</td>
      <td><span class="badge badge-info">${u['Роль']}</span></td>
      <td>${u['Email'] || ''}</td>
      <td><button class="btn btn-small btn-danger" onclick="deleteUser('${u['Логин']}')" ${u['Логин'] === currentUser.login ? 'disabled' : ''}>🗑️</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ==========================================
// МОДАЛЬНЫЕ ОКНА
// ==========================================
function openContractModal() {
  openModalHtml(`
    <h2>📄 Новый договор</h2>
    <div class="form-group"><label>Контрагент</label><input type="text" id="newContractor"></div>
    <div class="form-group"><label>Номер</label><input type="text" id="newContractNumber"></div>
    <div class="form-group"><label>Дата</label><input type="date" id="newContractDate"></div>
    <div class="form-group"><label>Предмет</label><textarea id="newSubject"></textarea></div>
    <div class="form-group"><label>Сумма</label><input type="number" id="newAmount"></div>
    <div class="form-group"><label>Ответственный</label><input type="text" id="newResponsible"></div>
    <button class="btn btn-primary btn-full" onclick="createContract()">✅ Создать</button>
  `);
}

async function createContract() {
  const res = await api('createContract', {
    contractor: val('newContractor'),
    contractNumber: val('newContractNumber'),
    contractDate: val('newContractDate'),
    subject: val('newSubject'),
    amount: val('newAmount'),
    responsible: val('newResponsible'),
    icon: '🏢',
    objectId: 'ОБЪ-001'
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openUploadDocModal(contractId) {
  openModalHtml(`
    <h2>📤 Загрузка документа</h2>
    <input type="hidden" id="uploadContractId" value="${contractId}">
    <div class="form-group"><label>Категория</label>
      <select id="uploadCategory">
        <option value="ИД">ИД</option>
        <option value="Материалы">Материалы</option>
        <option value="Финансы">Финансы</option>
        <option value="Переписка">Переписка</option>
      </select>
    </div>
    <div class="form-group"><label>Тип</label><input type="text" id="uploadFileType" placeholder="АОСР"></div>
    <div class="form-group"><label>Номер</label><input type="text" id="uploadDocNumber"></div>
    <div class="form-group"><label>Файл</label><input type="file" id="uploadFile" multiple></div>
    <button class="btn btn-primary btn-full" onclick="uploadDoc()">📤 Загрузить</button>
  `);
}

async function uploadDoc() {
  const fileInput = document.getElementById('uploadFile');
  if (!fileInput.files.length) return alert('Выберите файл');
  const files = [...fileInput.files];
  const filesData = [];
  for (const f of files) {
    if (f.size > 10 * 1024 * 1024) return alert(`Файл ${f.name} больше 10 МБ`);
    const data = await readFileAsBase64(f);
    filesData.push({ fileName: f.name, fileData: data });
  }
  const result = await api('bulkUpload', {
    contractId: val('uploadContractId'),
    category: val('uploadCategory'),
    fileType: val('uploadFileType'),
    docNumber: val('uploadDocNumber'),
    status: 'На проверке',
    files: filesData
  });
  if (result.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + result.error);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openSubmitVolumeModal(contractId = '') {
  openModalHtml(`
    <h2>📊 Подать объём на проверку</h2>
    <div class="form-group"><label>Договор</label>
      <select id="svContract">
        <option value="">Выберите</option>
        ${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Позиция</label><select id="svPosition"></select></div>
    <div class="form-group"><label>Объём</label><input type="number" id="svVolume"></div>
    <div class="form-group"><label>Комментарий</label><textarea id="svComment"></textarea></div>
    <button class="btn btn-primary btn-full" onclick="submitVolume()">📤 Подать</button>
  `);
}

async function submitVolume() {
  const res = await api('submitVolume', {
    contractId: val('svContract'),
    positionId: val('svPosition'),
    volume: val('svVolume'),
    comment: val('svComment')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openKS2Modal() {
  openModalHtml(`
    <h2>💰 Новый КС-2</h2>
    <div class="form-group"><label>Договор</label>
      <select id="ks2cContract">${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>Номер</label><input type="text" id="ks2cNumber"></div>
    <div class="form-group"><label>Дата</label><input type="date" id="ks2cDate"></div>
    <div class="form-group"><label>Период работ</label><input type="text" id="ks2cPeriod"></div>
    <div class="form-group"><label>Сумма</label><input type="number" id="ks2cAmount"></div>
    <button class="btn btn-primary btn-full" onclick="saveKS2()">💾 Сохранить</button>
  `);
}

async function saveKS2() {
  const res = await api('createKS2', {
    contractId: val('ks2cContract'),
    ks2Number: val('ks2cNumber'),
    date: val('ks2cDate'),
    period: val('ks2cPeriod'),
    totalAmount: val('ks2cAmount')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteKS2(id) {
  if (!confirm('Удалить КС-2?')) return;
  const res = await api('deleteKS2', { ks2Id: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openTenderModal() {
  openModalHtml(`
    <h2>📝 Тендер</h2>
    <div class="form-group"><label>Название</label><input type="text" id="tName"></div>
    <div class="form-group"><label>Заказчик</label><input type="text" id="tCustomer"></div>
    <div class="form-group"><label>№ извещения</label><input type="text" id="tNotice"></div>
    <div class="form-group"><label>Начальная цена</label><input type="number" id="tStartPrice"></div>
    <div class="form-group"><label>Наша цена</label><input type="number" id="tOurPrice"></div>
    <button class="btn btn-primary btn-full" onclick="saveTender()">💾 Сохранить</button>
  `);
}

async function saveTender() {
  const res = await api('createTender', {
    name: val('tName'),
    customer: val('tCustomer'),
    noticeNumber: val('tNotice'),
    startPrice: val('tStartPrice'),
    ourPrice: val('tOurPrice')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteTender(id) {
  if (!confirm('Удалить тендер?')) return;
  const res = await api('deleteTender', { tenderId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openPersonModal() {
  openModalHtml(`
    <h2>👤 Сотрудник</h2>
    <div class="form-group"><label>ФИО</label><input type="text" id="pFio"></div>
    <div class="form-group"><label>Должность</label><input type="text" id="pPos"></div>
    <div class="form-group"><label>Табельный №</label><input type="text" id="pTab"></div>
    <div class="form-group"><label>Телефон</label><input type="text" id="pPhone"></div>
    <div class="form-group"><label>Email</label><input type="email" id="pEmail"></div>
    <div class="form-group"><label>Дата приёма</label><input type="date" id="pDate"></div>
    <button class="btn btn-primary btn-full" onclick="savePerson()">💾 Сохранить</button>
  `);
}

async function savePerson() {
  const res = await api('createPerson', {
    fio: val('pFio'),
    position: val('pPos'),
    tabelNumber: val('pTab'),
    phone: val('pPhone'),
    email: val('pEmail'),
    hireDate: val('pDate')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deletePerson(id) {
  if (!confirm('Удалить сотрудника?')) return;
  const res = await api('deletePerson', { personId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openTaskModal() {
  openModalHtml(`
    <h2>📨 Новое задание</h2>
    <div class="form-group"><label>Исполнитель</label>
      <select id="taskTo">${(allData.users || []).filter(u => u['Логин'] !== currentUser.login).map(u => `<option value="${u['Логин']}">${u['ФИО']}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>Тема</label><input type="text" id="taskSubj"></div>
    <div class="form-group"><label>Описание</label><textarea id="taskDesc"></textarea></div>
    <div class="form-group"><label>Дедлайн</label><input type="date" id="taskDead"></div>
    <div class="form-group"><label>Приоритет</label>
      <select id="taskPrio"><option>Обычный</option><option>Высокий</option><option>Срочный</option></select>
    </div>
    <button class="btn btn-primary btn-full" onclick="saveTask()">✅ Создать</button>
  `);
}

async function saveTask() {
  const res = await api('createTask', {
    to: val('taskTo'),
    subject: val('taskSubj'),
    description: val('taskDesc'),
    deadline: val('taskDead'),
    priority: val('taskPrio')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function viewTask(id) {
  const res = await api('getTaskFull', { taskId: id });
  if (!res.success) return alert('Ошибка: ' + res.error);
  const task = res.task;
  const replies = res.replies || [];
  let html = `
    <h2>${task['Тема']}</h2>
    <div style="display:flex; gap:8px; margin-bottom:16px;">
      <span class="badge badge-info">${task['Приоритет']}</span>
      <span class="badge ${task['Статус'] === 'Выполнено' ? 'badge-success' : 'badge-warning'}">${task['Статус']}</span>
    </div>
    <div class="card">
      <div class="card-meta">
        <b>От:</b> ${task['От_кого']} | <b>Кому:</b> ${task['Кому']}<br>
        <b>Дедлайн:</b> ${task['Дедлайн'] || '—'}<br>
        <b>Описание:</b><br>${task['Описание']}
      </div>
    </div>
    <h3>💬 История (${replies.length})</h3>
    ${replies.map(r => `<div class="card" style="margin-bottom:8px;">
      <div class="card-meta"><b>${r['От_кого']}</b> | ${r['Время']}<br>${r['Текст']}</div>
    </div>`).join('') || '<p>Нет ответов</p>'}
    <div class="form-group" style="margin-top:16px;">
      <label>Ответить</label>
      <textarea id="taskReplyText"></textarea>
    </div>
    <button class="btn btn-primary btn-full" onclick="sendTaskReply('${task['ID']}')">📤 Отправить</button>
  `;
  openModalHtml(html);
}

async function sendTaskReply(taskId) {
  const text = val('taskReplyText');
  if (!text) return;
  const res = await api('addTaskReply', { taskId, text });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openEstimateModal() {
  openModalHtml(`
    <h2>📊 Смета</h2>
    <div class="form-group"><label>Договор</label>
      <select id="estContract">${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>Название</label><input type="text" id="estName"></div>
    <div class="form-group"><label>Сумма</label><input type="number" id="estAmount"></div>
    <button class="btn btn-primary btn-full" onclick="saveEstimate()">💾 Сохранить</button>
  `);
}

async function saveEstimate() {
  const res = await api('createEstimate', {
    contractId: val('estContract'),
    name: val('estName'),
    totalAmount: val('estAmount')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteEstimate(id) {
  if (!confirm('Удалить смету?')) return;
  const res = await api('deleteEstimate', { estimateId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openContractorModal() {
  openModalHtml(`
    <h2>🏢 Подрядчик</h2>
    <div class="form-group"><label>Название</label><input type="text" id="cName"></div>
    <div class="form-group"><label>ИНН</label><input type="text" id="cInn"></div>
    <div class="form-group"><label>Контактное лицо</label><input type="text" id="cContact"></div>
    <div class="form-group"><label>Телефон</label><input type="text" id="cPhone"></div>
    <div class="form-group"><label>Email</label><input type="email" id="cEmail"></div>
    <button class="btn btn-primary btn-full" onclick="saveContractor()">💾 Сохранить</button>
  `);
}

async function saveContractor() {
  const res = await api('createContractor', {
    name: val('cName'),
    inn: val('cInn'),
    contactPerson: val('cContact'),
    phone: val('cPhone'),
    email: val('cEmail')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteContractor(id) {
  if (!confirm('Удалить подрядчика?')) return;
  const res = await api('deleteContractor', { contractorId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

async function viewContractor(id) {
  const res = await api('getContractorSummary', { contractorId: id });
  if (!res.success) return alert('Ошибка: ' + res.error);
  const c = res.contractor;
  const s = res.summary;
  openModalHtml(`
    <h2>🏢 ${c['Название']}</h2>
    <div class="stats">
      <div class="stat-box"><div class="stat-number">${money(s.totalContract)}</div><div class="stat-label">Договорная сумма</div></div>
      <div class="stat-box"><div class="stat-number">${money(s.totalClosed)}</div><div class="stat-label">Закрыто</div></div>
      <div class="stat-box"><div class="stat-number">${money(s.totalPaid)}</div><div class="stat-label">Выплачено</div></div>
      <div class="stat-box"><div class="stat-number" style="color:${s.totalBalance >= 0 ? '#10b981' : '#ef4444'}">${money(s.totalBalance)}</div><div class="stat-label">${s.totalBalance >= 0 ? 'К выплате' : 'Переплата'}</div></div>
    </div>
  `);
}

function openMaterialModal() {
  openModalHtml(`
    <h2>📦 Материал</h2>
    <div class="form-group"><label>Наименование</label><input type="text" id="mName"></div>
    <div class="form-group"><label>Поставщик</label><input type="text" id="mSupplier"></div>
    <div class="form-group"><label>Количество</label><input type="number" id="mQty"></div>
    <div class="form-group"><label>Ед. изм.</label><input type="text" id="mUnit" value="шт"></div>
    <button class="btn btn-primary btn-full" onclick="saveMaterial()">💾 Сохранить</button>
  `);
}

async function saveMaterial() {
  const res = await api('addMaterial', {
    name: val('mName'),
    supplier: val('mSupplier'),
    quantity: val('mQty'),
    unit: val('mUnit'),
    status: 'Заказан'
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteMaterial(id) {
  if (!confirm('Удалить материал?')) return;
  const res = await api('deleteMaterial', { materialId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openReminderModal() {
  openModalHtml(`
    <h2>⏰ Напоминание</h2>
    <div class="form-group"><label>Тип</label>
      <select id="rType">
        <option>Инструктаж</option>
        <option>Поверка</option>
        <option>Сертификат</option>
        <option>Оплата</option>
        <option>Другое</option>
      </select>
    </div>
    <div class="form-group"><label>Объект</label><input type="text" id="rObject"></div>
    <div class="form-group"><label>Описание</label><textarea id="rDesc"></textarea></div>
    <div class="form-group"><label>Дата</label><input type="date" id="rDate"></div>
    <div class="form-group"><label>Ответственный</label><input type="text" id="rResp"></div>
    <button class="btn btn-primary btn-full" onclick="saveReminder()">💾 Сохранить</button>
  `);
}

async function saveReminder() {
  const res = await api('addReminder', {
    type: val('rType'),
    object: val('rObject'),
    description: val('rDesc'),
    date: val('rDate'),
    responsible: val('rResp')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteReminder(id) {
  if (!confirm('Удалить напоминание?')) return;
  const res = await api('deleteReminder', { reminderId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openUserModal() {
  openModalHtml(`
    <h2>👤 Пользователь</h2>
    <div class="form-group"><label>Логин</label><input type="text" id="uLogin"></div>
    <div class="form-group"><label>Пароль</label><input type="text" id="uPass"></div>
    <div class="form-group"><label>ФИО</label><input type="text" id="uFio"></div>
    <div class="form-group"><label>Роль</label>
      <select id="uRole">
        <option>Администратор</option>
        <option>ПТО</option>
        <option>Бухгалтерия</option>
        <option>Прораб</option>
        <option>Архитектор</option>
        <option>ГИП</option>
        <option>ГАП</option>
      </select>
    </div>
    <div class="form-group"><label>Email</label><input type="email" id="uEmail"></div>
    <button class="btn btn-primary btn-full" onclick="saveUser()">✅ Создать</button>
  `);
}

async function saveUser() {
  const res = await api('createUser', {
    login: val('uLogin'),
    password: val('uPass'),
    fio: val('uFio'),
    role: val('uRole'),
    email: val('uEmail'),
    access: 'Полный'
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteUser(login) {
  if (!confirm('Удалить пользователя?')) return;
  const res = await api('deleteUser', { login });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

// ==========================================
// КОРЗИНА И ИСТОРИЯ
// ==========================================
async function loadTrash() {
  const res = await api('getTrash');
  if (!res.success) return;
  const el = document.getElementById('trashList');
  if (!el) return;
  let html = '';
  Object.entries(res.trash).forEach(([sheet, items]) => {
    html += `<div class="card">
      <h3>${sheet} (${items.length})</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
        <tbody>${items.map(item => `<tr>
          <td>${item.id}</td>
          <td>${item.display}</td>
          <td>
            <button class="btn btn-small btn-success" onclick="restoreItem('${sheet}', '${item.id}', '${item.idField}')">✅ Восстановить</button>
            <button class="btn btn-small btn-danger" onclick="permDeleteItem('${sheet}', '${item.id}', '${item.idField}')">🗑️ Навсегда</button>
          </td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  });
  el.innerHTML = html || '<div class="loader">Корзина пуста</div>';
}

async function restoreItem(sheet, id, field) {
  const res = await api('restoreFromTrash', { sheetName: sheet, recordId: id, idField: field });
  if (res.success) { loadTrash(); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function permDeleteItem(sheet, id, field) {
  if (!confirm('Удалить навсегда?')) return;
  const res = await api('permanentDelete', { sheetName: sheet, recordId: id, idField: field });
  if (res.success) loadTrash(); else alert('Ошибка: ' + res.error);
}

async function loadHistory() {
  const res = await api('getHistory', { limit: 100 });
  if (!res.success) return;
  const el = document.getElementById('historyList');
  if (!el) return;
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Сущность</th><th>Детали</th></tr></thead>
    <tbody>${(res.history || []).map(h => `<tr>
      <td>${h['Дата']}</td>
      <td>${h['Пользователь']}</td>
      <td>${h['Действие']}</td>
      <td>${h['Сущность']}</td>
      <td>${h['Комментарий'] || ''}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ==========================================
// ЭКСПОРТ
// ==========================================
function exportData() {
  const type = prompt('Что экспортировать? (contracts, documents, materials, reminders, personnel, tenders, ks2)', 'contracts');
  if (!type) return;
  api('exportCSV', { type }).then(res => {
    if (res.success) window.open(res.fileUrl, '_blank');
    else alert('Ошибка: ' + res.error);
  });
}

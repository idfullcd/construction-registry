const API_URL = 'https://script.google.com/macros/s/AKfycbw7mLMaEQs_GVNu6X02vnKsi0MvsGnllZMC2trvVx_jDAr8Sn-b-D0iV_1vYRTj6PIbJw/exec';

let currentUser = null;
let allData = {};
let currentCalendarDate = new Date();
let refreshTimer = null;

const TAB_GROUPS = {
  'workflow': [['contracts', '📋 Договоры'], ['progress', '📊 Прогресс'], ['submissions', '📝 Подачи'], ['ks2', '💰 КС-2'], ['additional', '➕ Доп. работы']],
  'docs': [['documentation', '📑 Документация'], ['architecture', '🏛️ Архитектура']],
  'commercial': [['tenders', '📝 Тендеры'], ['kp', '💼 КП'], ['contractors', '🏢 Подрядчики']],
  'people': [['personnel', '👥 Персонал'], ['orders', '📋 Приказы'], ['workforce', '👷 Численность']],
  'planning': [['planning', '📅 ППР'], ['prescriptions', '⚠️ Предписания'], ['approvals', '🤝 Согласования'], ['daily', '📅 Отчёты'], ['workorders', '📝 Наряды']],
  'other': [['objects', '🏗️ Объекты'], ['materials', '📦 Материалы'], ['reminders', '⏰ Напоминания'], ['calendar', '📅 Календарь'], ['tasks', '📨 Задания'], ['estimates', '📊 Сметы']],
  'analytics': [['dashboard', '📈 Дашборд'], ['actions', '📜 Журнал'], ['trash', '🗑️ Корзина'], ['history', '📜 История']],
  'admin': [['admin', '⚙️ Админ']]
};

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }
function money(v) { return Number(v || 0).toLocaleString('ru-RU') + ' ₽'; }
function fileLink(url, label = '📄 Открыть') { return url ? `<a class="btn btn-small btn-info" href="${url}" target="_blank">${label}</a>` : ''; }
function driveDownload(fileId) { return fileId ? `<a class="btn btn-small btn-success" href="https://drive.google.com/uc?export=download&id=${fileId}" target="_blank">⬇️</a>` : ''; }

async function api(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, userLogin: currentUser?.login, ...payload })
    });
    return await res.json();
  } catch (e) {
    console.error('API Error:', e);
    return { success: false, error: 'Ошибка соединения' };
  }
}

function initTheme() {
  document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light';
}
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
  if (window.categoryChartInstance) renderDashboard();
}
initTheme();

function buildTabs() {
  const container = document.getElementById('tabsContainer');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(TAB_GROUPS).forEach(([group, tabs]) => {
    const titles = { workflow: '📋 Рабочие процессы', docs: '📑 Документация', commercial: '💼 Коммерция', people: '👥 Люди', planning: '📅 Планирование', other: '🔧 Прочее', analytics: '📊 Аналитика', admin: '⚙️ Админ' };
    const groupDiv = document.createElement('div');
    groupDiv.className = 'tabs-group';
    groupDiv.innerHTML = `<div class="tabs-group-title">${titles[group]}</div><div class="tabs" id="tabs-${group}"></div>`;
    container.appendChild(groupDiv);
    const tabsDiv = groupDiv.querySelector('.tabs');
    tabs.forEach(([id, label]) => {
      const hidden = (id === 'admin' && currentUser?.role !== 'Администратор');
      tabsDiv.innerHTML += `<div class="tab" data-tab="${id}" onclick="switchTabDirect('${id}')" style="${hidden ? 'display:none;' : ''}">${label}</div>`;
    });
  });
  const firstTab = document.querySelector('.tab');
  if (firstTab) firstTab.classList.add('active');
}

function switchTabDirect(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const tabEl = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (tabEl) tabEl.classList.add('active');
  const contentEl = document.getElementById('tab-' + tabId);
  if (contentEl) contentEl.classList.add('active');
  
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'calendar') renderCalendar();
  if (tabId === 'trash') loadTrash();
  if (tabId === 'history') loadHistory();
  updateMobileNav();
}

function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function openModalHtml(html) {
  document.getElementById('universalModalBody').innerHTML = html;
  document.getElementById('universalModal').style.display = 'block';
}

async function login() {
  const loginVal = val('loginInput').trim();
  const passwordVal = val('passwordInput').trim();
  const err = document.getElementById('loginError');
  err.textContent = 'Проверка...';
  
  const res = await api('login', { login: loginVal, password: passwordVal });
  if (res.success) {
    currentUser = res.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    showMainScreen();
  } else {
    err.textContent = res.error || 'Неверный логин или пароль';
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('user');
  clearInterval(refreshTimer);
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('mainScreen').style.display = 'none';
}

function showMainScreen() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainScreen').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.fio;
  document.getElementById('userRole').textContent = currentUser.role;
  buildTabs();
  loadData();
  refreshTimer = setInterval(() => loadData(true), 60000);
}

window.onload = () => {
  const saved = localStorage.getItem('user');
  if (saved) {
    currentUser = JSON.parse(saved);
    showMainScreen();
  }
};

document.getElementById('passwordInput').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

async function loadData(silent = false) {
  if (!silent) {
    const list = document.getElementById('contractsList');
    if (list) list.innerHTML = '<div class="loader">Загрузка...</div>';
  }
  
  try {
    const res = await fetch(`${API_URL}?type=all`);
    const data = await res.json();
    allData = data;
    
    renderContracts();
    renderSubmissions();
    renderKS2List();
    renderAdditionalWorks();
    renderDocumentation();
    renderTenders();
    renderKPList();
    renderPersonnel();
    renderGenericLists();
    renderCalendar();
    renderDashboard();
    renderActions();
    renderUsers();
    renderEstimatesList();
    renderArchProjects();
    renderContractors();
    renderTasks();
    
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

function renderContracts() {
  const search = val('contractSearch').toLowerCase();
  let contracts = allData.contracts || [];
  if (search) contracts = contracts.filter(c => String(c['Контрагент'] || '').toLowerCase().includes(search) || String(c['Номер_Договора'] || '').toLowerCase().includes(search));
  
  const list = document.getElementById('contractsList');
  if (!list) return;
  
  if (contracts.length === 0) {
    list.innerHTML = '<div class="loader">Договоры не найдены</div>';
    return;
  }
  
  list.innerHTML = contracts.map(c => {
    const docs = (allData.documents || []).filter(d => d['ID_Договора'] === c['ID_Договора']);
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${c['Иконка'] || '🏢'} ${c['Контрагент']} <span class="badge badge-info">${c['ID_Договора']}</span></div>
            <div class="card-meta">№${c['Номер_Договора']} от ${c['Дата_Договора']} | ${c['Предмет']} | ${money(c['Сумма'])} | Отв: ${c['Ответственный']}</div>
            <div class="card-meta">Документов: ${docs.length}</div>
          </div>
          <div>
            <button class="btn btn-small btn-success" onclick="openUploadDocModal('${c['ID_Договора']}')">📤 Документ</button>
            <button class="btn btn-small btn-info" onclick="openSubmitVolumeModal('${c['ID_Договора']}')">📊 Объём</button>
            ${fileLink(c['Ссылка_на_папку'], '📁 Папка')}
          </div>
        </div>
      </div>
    `;
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
    const canReview = ['Администратор', 'ПТО', 'ГИП', 'ГАП'].includes(currentUser.role);
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${pos ? pos['Наименование'] : r['ID_Позиции']}</div>
            <div class="card-meta">${(allData.contracts || []).find(c => c['ID_Договора'] === r['ID_Договора'])?.['Контрагент'] || '—'}<br>
            Подал: ${r['Кто_подал']} | ${r['Дата_подачи']}<br>Объём: <b>${r['Объём_подан']}</b>${r['Скорректированный_объём'] ? ` → ${r['Скорректированный_объём']}` : ''}</div>
            ${r['Комментарий_проверяющего'] ? `<div class="card-meta">💬 ${r['Комментарий_проверяющего']}</div>` : ''}
          </div>
          <div>
            <span class="badge ${r['Статус'] === 'На_проверке' ? 'badge-warning' : r['Статус'] === 'Подтверждено' ? 'badge-success' : 'badge-danger'}">${r['Статус']}</span>
            ${canReview && r['Статус'] === 'На_проверке' ? `
              <button class="btn btn-small btn-success" onclick="reviewSubmission('${r['ID']}', 'Подтверждено', ${r['Объём_подан']})">✅</button>
              <button class="btn btn-small btn-warning" onclick="editSubmission('${r['ID']}', ${r['Объём_подан']})">✏️</button>
              <button class="btn btn-small btn-danger" onclick="reviewSubmission('${r['ID']}', 'Отклонено', 0)">❌</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') || '<div class="loader">Подач нет</div>';
}

function renderKS2List() {
  const filter = val('ks2ContractFilter');
  let rows = allData.ks2Registry || [];
  if (filter) rows = rows.filter(r => r['ID_Договора'] === filter);
  
  const list = document.getElementById('ks2List');
  if (!list) return;
  
  list.innerHTML = rows.map(r => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">КС-2 №${r['Номер_КС2']}</div>
          <div class="card-meta">${(allData.contracts || []).find(c => c['ID_Договора'] === r['ID_Договора'])?.['Контрагент'] || '—'}<br>
          Дата: ${r['Дата_составления']} | Период: ${r['Период_работ']}<br>Сумма: <b>${money(r['Общая_сумма'])}</b></div>
        </div>
        <div>
          <span class="badge badge-info">${r['Статус']}</span>
          ${fileLink(r['Ссылка_на_файл'])}${driveDownload(r['FileID'])}
          <button class="btn btn-small btn-danger" onclick="deleteKS2('${r['ID']}')">🗑️</button>
        </div>
      </div>
    </div>
  `).join('') || '<div class="loader">КС-2 нет</div>';
}

function renderAdditionalWorks() {
  const filter = val('additionalContractFilter');
  let rows = allData.additionalWorks || [];
  if (filter) rows = rows.filter(r => r['ID_Договора'] === filter);
  
  const list = document.getElementById('additionalWorksList');
  if (!list) return;
  
  list.innerHTML = rows.map(r => {
    const photos = (allData.additionalWorksPhotos || []).filter(p => p['ID_Доп_работы'] === r['ID']);
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${r['Наименование']}</div>
            <div class="card-meta">${(allData.contracts || []).find(c => c['ID_Договора'] === r['ID_Договора'])?.['Контрагент'] || '—'}<br>
            ${r['Количество']} ${r['Ед_изм']} × ${money(r['Цена'])} = <b>${money(r['Сумма'])}</b><br>Статус: ${r['Статус']}</div>
          </div>
          <div>
            <button class="btn btn-small btn-success" onclick="uploadAdditionalPhotos('${r['ID']}')">📷 Фото</button>
            <button class="btn btn-small btn-danger" onclick="deleteAdditionalWork('${r['ID']}')">🗑️</button>
          </div>
        </div>
        ${photos.length > 0 ? `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:8px; margin-top:10px;">
          ${photos.map(p => `<div style="border:1px solid var(--border); border-radius:var(--r-sm); padding:6px; font-size:12px;">
            ${fileLink(p['Ссылка'], '📷 Открыть')}${driveDownload(p['FileID'])}
          </div>`).join('')}
        </div>` : ''}
      </div>
    `;
  }).join('') || '<div class="loader">Доп. работ нет</div>';
}

function renderDocumentation() {
  const contractFilter = val('docContractFilter');
  const sectionFilter = val('docSectionFilter');
  const sections = {
    'ИД': ['АОСР', 'АОК', 'Исполнительная_схема', 'Акт_входного_контроля', 'Протокол_испытаний', 'Фотофиксация', 'Журнал_работ'],
    'ПД': ['Проектная_документация', 'Рабочая_документация', 'Чертежи', 'Спецификация'],
    'РД': ['Разрешение_на_строительство', 'Ордер_ОАТИ', 'Порубочный_билет', 'ЗОС'],
    'ФД': ['КС-2', 'КС-3', 'КС-6а', 'М-29', 'Акт_сверки', 'Счет-фактура', 'УПД'],
    'КД': ['Приказ', 'Трудовой_договор', 'Личная_карточка'],
    'ПО': ['ППР', 'ПОС', 'Техкарта', 'Техзадание', 'График_работ', 'Наряд-задание']
  };
  
  let docs = allData.documents || [];
  if (contractFilter) docs = docs.filter(d => d['ID_Договора'] === contractFilter);
  
  const list = document.getElementById('documentationList');
  if (!list) return;
  
  let html = '';
  Object.entries(sections).forEach(([key, types]) => {
    if (sectionFilter && sectionFilter !== key) return;
    const sectionDocs = docs.filter(d => types.includes(d['Тип_документа']));
    if (sectionDocs.length === 0) return;
    
    html += `
      <div class="card">
        <h3>${key} (${sectionDocs.length})</h3>
        ${sectionDocs.map(d => `<div class="card-meta" style="padding:8px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
          <span>${d['Тип_документа']} №${d['Номер'] || '—'} — ${d['Наименование']}</span>
          <span>${driveDownload(d['FileID'])}</span>
        </div>`).join('')}
      </div>
    `;
  });
  list.innerHTML = html || '<div class="loader">Документов нет</div>';
}

function renderTenders() {
  const filter = val('tenderStatusFilter');
  let rows = allData.tenders || [];
  if (filter) rows = rows.filter(r => r['Статус'] === filter);
  
  const list = document.getElementById('tendersList');
  if (!list) return;
  
  list.innerHTML = rows.map(r => {
    const docs = (allData.tenderDocs || []).filter(d => d['ID_Тендера'] === r['ID']);
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${r['Название']}</div>
            <div class="card-meta">${r['Заказчик']} | № ${r['Номер_извещения']}<br>
            Подача: ${r['Дата_подачи'] || '—'} | Наша цена: ${money(r['Наша_цена'])}<br>Документов: ${docs.length}</div>
          </div>
          <div>
            <span class="badge badge-info">${r['Статус']}</span>
            <button class="btn btn-small btn-success" onclick="openTenderDocModal('${r['ID']}')">📄 Документ</button>
            <button class="btn btn-small btn-danger" onclick="deleteTender('${r['ID']}')">🗑️</button>
          </div>
        </div>
        ${docs.map(d => `<div class="card-meta" style="padding:4px 0;">${d['Тип_документа']}: ${d['Наименование']} ${fileLink(d['Ссылка'])}${driveDownload(d['FileID'])}</div>`).join('')}
      </div>
    `;
  }).join('') || '<div class="loader">Тендеров нет</div>';
}

function renderKPList() {
  const filter = val('kpStatusFilter');
  let rows = allData.commercialProposals || [];
  if (filter) rows = rows.filter(r => r['Статус'] === filter);
  
  const list = document.getElementById('kpList');
  if (!list) return;
  
  list.innerHTML = rows.map(r => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">КП №${r['Номер_КП']}</div>
          <div class="card-meta">${r['Заказчик']} | ${r['Объект']}<br>${money(r['Сумма'])} | ${r['Статус']}</div>
        </div>
        <div>
          ${fileLink(r['Ссылка_на_файл'])}${driveDownload(r['FileID'])}
          <button class="btn btn-small btn-danger" onclick="deleteKP('${r['ID']}')">🗑️</button>
        </div>
      </div>
    </div>
  `).join('') || '<div class="loader">КП нет</div>';
}

function renderPersonnel() {
  const search = val('personnelSearch').toLowerCase();
  let rows = allData.personnel || [];
  if (search) rows = rows.filter(r => String(r['ФИО'] || '').toLowerCase().includes(search) || String(r['Должность'] || '').toLowerCase().includes(search));
  
  const list = document.getElementById('personnelList');
  if (!list) return;
  
  list.innerHTML = rows.map(r => {
    const docs = (allData.personnelDocs || []).filter(d => d['ID_Сотрудника'] === r['ID']);
    const initials = String(r['ФИО'] || '?').split(' ').map(x => x[0]).join('').slice(0, 2);
    return `
      <div class="card">
        <div class="card-header">
          <div style="display:flex; gap:14px; align-items:center;">
            <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, var(--accent), #f7931e); display:flex; align-items:center; justify-content:center; color:white; font-size:22px; font-weight:700;">${initials}</div>
            <div>
              <div class="card-title">${r['ФИО']}</div>
              <div class="card-meta">${r['Должность']} | таб. №${r['Табельный_номер'] || '—'}<br>${r['Телефон'] || '—'} | ${r['Email'] || '—'}<br>📅 Принят: ${r['Дата_приёма'] || '—'} | Документов: ${docs.length}</div>
            </div>
          </div>
          <div>
            <button class="btn btn-small btn-success" onclick="openPersonDocModal('${r['ID']}')">📄 Документ</button>
            <button class="btn btn-small btn-danger" onclick="deletePerson('${r['ID']}')">🗑️</button>
          </div>
        </div>
        ${docs.map(d => `<div class="card-meta" style="padding:4px 0;">${d['Тип_документа']} №${d['Номер'] || '—'} (до ${d['Срок_действия'] || '—'}) ${fileLink(d['Ссылка'])}${driveDownload(d['FileID'])}</div>`).join('')}
      </div>
    `;
  }).join('') || '<div class="loader">Сотрудников нет</div>';
}

function renderGenericLists() {
  const modules = {
    'orders': { title: 'Приказы', data: allData.orders, cols: ['Номер', 'Дата', 'Тип', 'Сотрудник', 'Статус'] },
    'planning': { title: 'ППР/Техкарты', data: allData.pprTechcards, cols: ['Тип', 'Название', 'Номер', 'Версия', 'Статус'] },
    'prescriptions': { title: 'Предписания', data: allData.prescriptions, cols: ['Тип', 'Номер', 'Дата', 'Срок_исполнения', 'Статус'] },
    'approvals': { title: 'Согласования', data: allData.approvals, cols: ['Тип', 'Название', 'С_кем_согласуется', 'Дата_ответа', 'Статус'] },
    'daily': { title: 'Ежедневные отчёты', data: allData.dailyReports, cols: ['Дата', 'Прораб', 'Численность', 'Выполнено', 'Проблемы'] },
    'workorders': { title: 'Наряды-задания', data: allData.workOrders, cols: ['Номер', 'Дата', 'Бригада', 'Вид_работ', 'Статус'] },
    'workforce': { title: 'Численность', data: allData.workforce, cols: ['Дата', 'Профессия', 'Количество', 'ФИО_мастера', 'Примечание'] },
    'materials': { title: 'Материалы', data: allData.materials, cols: ['Наименование', 'Поставщик', 'Количество', 'Ед.изм', 'Статус'] },
    'reminders': { title: 'Напоминания', data: allData.reminders, cols: ['Тип', 'Объект', 'Дата', 'Статус', 'Ответственный'] }
  };
  
  Object.entries(modules).forEach(([key, mod]) => {
    const list = document.getElementById(key + 'List');
    if (!list) return;
    
    if (!mod.data || mod.data.length === 0) {
      list.innerHTML = '<div class="loader">Записей нет</div>';
      return;
    }
    
    list.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>${mod.cols.map(c => `<th>${c}</th>`).join('')}<th>Файл</th><th>Действия</th></tr></thead>
          <tbody>
            ${mod.data.map(r => `
              <tr>
                ${mod.cols.map(c => `<td>${r[c] || ''}</td>`).join('')}
                <td>${fileLink(r['Ссылка'])}${driveDownload(r['FileID'])}</td>
                <td><button class="btn btn-small btn-danger" onclick="deleteGeneric('${key}', '${r['ID']}')">🗑️</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  });
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('calendarMonth');
  if (!grid || !monthLabel) return;
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  monthLabel.textContent = currentCalendarDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = (first.getDay() + 6) % 7;
  
  let html = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => `<div class="card" style="padding:8px; text-align:center; font-weight:bold;">${d}</div>`).join('');
  for (let i = 0; i < start; i++) html += '<div></div>';
  
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const events = (allData.calendarEvents || []).filter(e => e['Дата'] === dateStr);
    html += `<div class="card" style="min-height:90px; padding:8px;"><b>${d}</b>${events.map(e => `<div class="badge badge-info" style="margin-top:4px; display:block;">${e['Тип']}</div>`).join('')}</div>`;
  }
  grid.innerHTML = html;
}

function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

function renderDashboard() {
  const stats = document.getElementById('dashboardStats');
  if (stats) {
    stats.innerHTML = `
      <div class="stat-box"><div class="stat-number">${(allData.contracts || []).length}</div><div class="stat-label">Договоров</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.documents || []).length}</div><div class="stat-label">Документов</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.tenders || []).length}</div><div class="stat-label">Тендеров</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.personnel || []).filter(p => p['Статус'] === 'Работает').length}</div><div class="stat-label">Сотрудников</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.ks2Registry || []).length}</div><div class="stat-label">КС-2</div></div>
      <div class="stat-box"><div class="stat-number">${(allData.tasks || []).length}</div><div class="stat-label">Заданий</div></div>
    `;
  }
  
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  if (window.categoryChartInstance) window.categoryChartInstance.destroy();
  
  const docs = allData.documents || [];
  const cats = {};
  docs.forEach(d => { const c = d['Категория'] || 'Другое'; cats[c] = (cats[c] || 0) + 1; });
  
  window.categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(cats),
      datasets: [{ data: Object.values(cats), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'] }]
    },
    options: { plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() } } } }
  });
}

function renderActions() {
  const rows = (allData.actions || []).slice().reverse().slice(0, 200);
  const el = document.getElementById('actionsList');
  if (!el) return;
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${r['Дата']}</td><td>${r['Пользователь']}</td><td>${r['Действие']}</td><td>${r['Объект']}</td><td>${r['Детали'] || ''}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function renderUsers() {
  const el = document.getElementById('usersList');
  if (!el) return;
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Логин</th><th>ФИО</th><th>Роль</th><th>Email</th><th>Действия</th></tr></thead>
        <tbody>
          ${(allData.users || []).map(u => `
            <tr>
              <td>${u['Логин']}</td>
              <td>${u['ФИО']}</td>
              <td><span class="badge badge-info">${u['Роль']}</span></td>
              <td>${u['Email'] || ''}</td>
              <td>
                <button class="btn btn-small btn-danger" onclick="deleteUser('${u['Логин']}')" ${u['Логин'] === currentUser.login ? 'disabled' : ''}>🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderEstimatesList() {
  const filter = val('estimateContractFilter');
  const select = document.getElementById('estimateContractFilter');
  if (select && select.options.length <= 1) {
    (allData.contracts || []).forEach(c => select.innerHTML += `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`);
  }
  
  let rows = allData.estimates || [];
  if (filter) rows = rows.filter(r => r['ID_Договора'] === filter);
  
  const el = document.getElementById('estimatesList');
  if (!el) return;
  
  el.innerHTML = rows.map(r => {
    const positions = (allData.estimateItems || []).filter(p => p['ID_Сметы'] === r['ID_Сметы']);
    const totalSum = positions.reduce((s, p) => s + (parseFloat(p['Сумма']) || 0), 0);
    const closedSum = positions.reduce((s, p) => {
      const total = parseFloat(p['Количество']) || 0;
      const closed = parseFloat(p['Закрыто_объём']) || 0;
      return s + (total > 0 ? (closed / total) * (parseFloat(p['Сумма']) || 0) : 0);
    }, 0);
    const progress = totalSum > 0 ? Math.round((closedSum / totalSum) * 100) : 0;
    
    return `
      <div class="card" style="border-left-color:#8b5cf6;">
        <div class="card-header">
          <div style="flex:1;">
            <div class="card-title">📊 ${r['Название']} <span style="color:var(--muted); font-size:13px;">[${r['ID_Сметы']}]</span></div>
            <div class="card-meta">Договор: ${(allData.contracts || []).find(c => c['ID_Договора'] === r['ID_Договора'])?.['Контрагент'] || '—'} | 💰 ${money(r['Общая_сумма'])} | Позиций: ${positions.length}</div>
          </div>
          <div>
            <button class="btn btn-small btn-info" onclick="viewEstimate('${r['ID_Сметы']}')">👁️ Просмотр</button>
            <button class="btn btn-small btn-success" onclick="openEstimateItemModal('${r['ID_Сметы']}')">➕ Позиция</button>
            <button class="btn btn-small btn-danger" onclick="deleteEstimate('${r['ID_Сметы']}')">🗑️</button>
          </div>
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:12px; color:var(--muted); margin-bottom:4px;">Прогресс: ${progress}%</div>
          <div class="progress-bar-container"><div class="segment seg-green" style="width:${progress}%;">${progress}%</div></div>
        </div>
      </div>
    `;
  }).join('') || '<div class="loader">Смет не найдено</div>';
}

function renderArchProjects() {
  const filter = val('archTypeFilter');
  let rows = allData.archProjects || [];
  if (filter) rows = rows.filter(r => r['Тип'] === filter);
  
  const el = document.getElementById('archProjectsList');
  if (!el) return;
  
  el.innerHTML = rows.map(r => {
    const drawings = (allData.drawings || []).filter(d => d['ID_Проекта'] === r['ID_Проекта']);
    const supervision = (allData.authorSupervision || []).filter(s => s['ID_Проекта'] === r['ID_Проекта']);
    const openIssues = supervision.filter(s => s['Статус_устранения'] !== 'Устранено').length;
    
    return `
      <div class="card" style="border-left-color:#8b5cf6;">
        <div class="card-header">
          <div style="flex:1;">
            <div class="card-title">${r['Название']} <span style="color:var(--muted); font-size:13px;">[${r['ID_Проекта']}]</span></div>
            <div class="card-meta">Договор: ${(allData.contracts || []).find(c => c['ID_Договора'] === r['ID_Договора'])?.['Контрагент'] || '—'} | 👤 ${r['Автор']} | 📅 ${r['Дата_создания']} | 📌 v${r['Версия']}</div>
            <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
              <span class="badge badge-info">${r['Тип'].replace(/_/g, ' ')}</span>
              <span class="badge badge-warning">${r['Статус'].replace(/_/g, ' ')}</span>
              <span class="badge badge-info">📄 ${drawings.length} чертежей</span>
              ${openIssues > 0 ? `<span class="badge badge-danger">⚠️ ${openIssues} замечаний</span>` : ''}
            </div>
          </div>
          <div>
            <button class="btn btn-small btn-info" onclick="viewArchProject('${r['ID_Проекта']}')">👁️ Просмотр</button>
            <button class="btn btn-small btn-success" onclick="openDrawingModal('${r['ID_Проекта']}')">📐 Чертёж</button>
            ${r['Тип'] === 'Реставрационный' ? `<button class="btn btn-small btn-warning" onclick="openPreservationModal('${r['ID_Проекта']}')">🏛️ Предм. охраны</button>` : ''}
            <button class="btn btn-small btn-warning" onclick="openSupervisionModal('${r['ID_Проекта']}')">🔍 Надзор</button>
            ${fileLink(r['Ссылка_на_папку'], '📁 Папка')}
          </div>
        </div>
      </div>
    `;
  }).join('') || '<div class="loader">Архитектурные проекты не найдены</div>';
}

function renderContractors() {
  const filter = val('contractorFilter');
  const search = val('contractorSearch').toLowerCase();
  const select = document.getElementById('contractorFilter');
  if (select && select.options.length <= 1) {
    (allData.contractors || []).forEach(c => select.innerHTML += `<option value="${c['ID']}">${c['Название']}</option>`);
  }
  
  let rows = allData.contractors || [];
  if (filter) rows = rows.filter(r => r['ID'] === filter);
  if (search) rows = rows.filter(r => String(r['Название'] || '').toLowerCase().includes(search) || String(r['ИНН'] || '').includes(search));
  
  const stats = document.getElementById('contractorsStats');
  if (stats) {
    const total = rows.length;
    const active = rows.filter(r => r['Статус'] === 'Активен').length;
    const works = (allData.contractorWorks || []).length;
    const payments = (allData.payments || []).reduce((s, p) => s + (parseFloat(p['Сумма']) || 0), 0);
    stats.innerHTML = `
      <div class="stat-box"><div class="stat-number">${total}</div><div class="stat-label">Подрядчиков</div></div>
      <div class="stat-box"><div class="stat-number">${active}</div><div class="stat-label">Активных</div></div>
      <div class="stat-box"><div class="stat-number">${works}</div><div class="stat-label">Работ</div></div>
      <div class="stat-box"><div class="stat-number">${(payments / 1000000).toFixed(2)}М</div><div class="stat-label">Выплачено ₽</div></div>
    `;
  }
  
  const el = document.getElementById('contractorsList');
  if (!el) return;
  
  el.innerHTML = rows.map(r => {
    const works = (allData.contractorWorks || []).filter(w => w['ID_Подрядчика'] === r['ID']);
    const payments = (allData.payments || []).filter(p => p['ID_Подрядчика'] === r['ID']);
    const totalContract = works.reduce((s, w) => s + (parseFloat(w['Сумма_договорная']) || 0), 0);
    const totalClosed = works.reduce((s, w) => s + (parseFloat(w['Сумма_закрытая']) || 0), 0);
    const totalPaid = payments.reduce((s, p) => {
      const sum = parseFloat(p['Сумма']) || 0;
      return p['Тип'] === 'Возврат' ? s - sum : s + sum;
    }, 0);
    
    return `
      <div class="card">
        <div class="card-header">
          <div style="flex:1;">
            <div class="card-title">🏢 ${r['Название']} <span style="color:var(--muted); font-size:13px;">[${r['ID']}]</span></div>
            <div class="card-meta">ИНН: ${r['ИНН'] || '—'} | 👤 ${r['Контактное_лицо'] || '—'} | 📞 ${r['Телефон'] || '—'}<br>📧 ${r['Email'] || '—'} | Статус: <span class="badge badge-info">${r['Статус']}</span></div>
            <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; font-size:12px;">
              <span class="badge badge-info">🔨 Работ: ${works.length}</span>
              <span class="badge badge-warning">💰 Договор: ${totalContract.toLocaleString('ru-RU')} ₽</span>
              <span class="badge badge-success">✅ Закрыто: ${totalClosed.toLocaleString('ru-RU')} ₽</span>
              <span class="badge badge-info">💵 Выплачено: ${totalPaid.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
          <div>
            <button class="btn btn-small btn-info" onclick="viewContractor('${r['ID']}')">👁️ Обзор</button>
            <button class="btn btn-small btn-success" onclick="openContractorWorkModal(null, '${r['ID']}')">➕ Работа</button>
            <button class="btn btn-small btn-warning" onclick="openContractorModal('${r['ID']}')">✏️</button>
            <button class="btn btn-small btn-danger" onclick="deleteContractor('${r['ID']}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('') || '<div class="loader">Подрядчики не найдены</div>';
}

function renderTasks() {
  const filter = val('taskFilter');
  let tasks = allData.tasks || [];
  if (filter === 'incoming') tasks = tasks.filter(t => t['Кому'] === currentUser.login);
  else if (filter === 'outgoing') tasks = tasks.filter(t => t['От_кого'] === currentUser.login);
  
  const el = document.getElementById('tasksList');
  if (!el) return;
  
  if (tasks.length === 0) { el.innerHTML = '<div class="loader">Заданий нет</div>'; return; }
  
  el.innerHTML = tasks.map(t => `
    <div class="card" style="cursor:pointer;" onclick="viewTask('${t['ID']}')">
      <div class="card-header">
        <div>
          <div class="card-title">${t['Тема']} <span class="badge badge-info">${t['Приоритет']}</span></div>
          <div class="card-meta">От: ${t['От_кого']} → Кому: ${t['Кому']}<br>Дедлайн: ${t['Дедлайн'] || '—'}</div>
        </div>
        <span class="badge badge-${t['Статус'] === 'Выполнено' ? 'success' : 'warning'}">${t['Статус']}</span>
      </div>
    </div>
  `).join('');
}

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
    contractor: val('newContractor'), contractNumber: val('newContractNumber'), contractDate: val('newContractDate'),
    subject: val('newSubject'), amount: val('newAmount'), responsible: val('newResponsible'), icon: '🏢', objectId: 'ОБЪ-001'
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
        <option value="ИД">ИД</option><option value="Материалы">Материалы</option><option value="Финансы">Финансы</option><option value="Переписка">Переписка</option>
      </select>
    </div>
    <div class="form-group"><label>Тип</label><input type="text" id="uploadFileType" placeholder="Например: АОСР"></div>
    <div class="form-group"><label>Номер</label><input type="text" id="uploadDocNumber"></div>
    <div class="form-group"><label>Статус</label>
      <select id="uploadStatus"><option value="На проверке">На проверке</option><option value="Согласован">Согласован</option><option value="Замечания">Замечания</option></select>
    </div>
    <div class="form-group"><label>Файл</label><input type="file" id="uploadFile"></div>
    <button class="btn btn-primary btn-full" onclick="uploadDoc()">📤 Загрузить</button>
  `);
}

async function uploadDoc() {
  const fileInput = document.getElementById('uploadFile');
  if (!fileInput.files[0]) return alert('Выберите файл');
  
  const file = fileInput.files[0];
  if (file.size > 10 * 1024 * 1024) return alert('Файл больше 10 МБ');
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    const result = await api('bulkUpload', {
      contractId: val('uploadContractId'), category: val('uploadCategory'), fileType: val('uploadFileType'),
      docNumber: val('uploadDocNumber'), status: val('uploadStatus'),
      files: [{ fileName: file.name, fileData: e.target.result.split(',')[1] }]
    });
    if (result.success) { closeModal('universalModal'); loadData(); }
    else alert('Ошибка: ' + result.error);
  };
  reader.readAsDataURL(file);
}

async function reviewSubmission(id, status, volume) {
  const comment = status === 'Отклонено' ? prompt('Причина отклонения:') : '';
  const res = await api('reviewSubmission', { submissionId: id, status, correctedVolume: volume, comment });
  if (res.success) loadData();
  else alert('Ошибка: ' + res.error);
}

function editSubmission(id, oldVolume) {
  const newVolume = prompt('Новый объём:', oldVolume);
  if (newVolume === null) return;
  const comment = prompt('Комментарий:', '');
  api('reviewSubmission', { submissionId: id, status: 'Отредактировано', correctedVolume: Number(newVolume), comment }).then(res => {
    if (res.success) loadData(); else alert('Ошибка: ' + res.error);
  });
}

async function deleteKS2(id) {
  if (!confirm('Удалить КС-2?')) return;
  const res = await api('deleteKS2', { ks2Id: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openAdditionalWorkModal() {
  openModalHtml(`
    <h2>➕ Дополнительная работа</h2>
    <div class="form-group"><label>Договор</label><select id="awContract">${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`).join('')}</select></div>
    <div class="form-group"><label>Наименование</label><input type="text" id="awName"></div>
    <div class="form-group"><label>Обоснование</label><textarea id="awJustification"></textarea></div>
    <div class="form-group"><label>Ед. изм.</label><input type="text" id="awUnit" value="шт"></div>
    <div class="form-group"><label>Количество</label><input type="number" id="awQty"></div>
    <div class="form-group"><label>Цена</label><input type="number" id="awPrice"></div>
    <button class="btn btn-primary btn-full" onclick="saveAdditionalWork()">💾 Сохранить</button>
  `);
}

async function saveAdditionalWork() {
  const res = await api('addAdditionalWork', {
    contractId: val('awContract'), name: val('awName'), justification: val('awJustification'),
    unit: val('awUnit'), quantity: val('awQty'), price: val('awPrice')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function uploadAdditionalPhotos(workId) {
  openModalHtml(`
    <h2>📷 Фото доп. работы</h2>
    <input type="hidden" id="photoWorkId" value="${workId}">
    <div class="form-group"><label>Файлы</label><input type="file" id="photoFiles" multiple accept="image/*"></div>
    <button class="btn btn-primary btn-full" onclick="savePhotos()">📤 Загрузить</button>
  `);
}

async function savePhotos() {
  const files = document.getElementById('photoFiles').files;
  if (!files.length) return;
  
  let completed = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > 10 * 1024 * 1024) { alert(`Файл ${file.name} слишком большой`); completed++; continue; }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      await api('uploadAdditionalWorkPhoto', {
        workId: val('photoWorkId'), fileName: file.name, mimeType: file.type, fileData: e.target.result.split(',')[1]
      });
      completed++;
      if (completed === files.length) { closeModal('universalModal'); loadData(); }
    };
    reader.readAsDataURL(file);
  }
}

async function deleteAdditionalWork(id) {
  if (!confirm('Удалить?')) return;
  const res = await api('deleteAdditionalWork', { workId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openTenderModal() {
  openModalHtml(`
    <h2>📝 Тендер</h2>
    <div class="form-group"><label>Название</label><input type="text" id="tName"></div>
    <div class="form-group"><label>Заказчик</label><input type="text" id="tCustomer"></div>
    <div class="form-group"><label>№ извещения</label><input type="text" id="tNotice"></div>
    <div class="form-group"><label>Дата публикации</label><input type="date" id="tPubDate"></div>
    <div class="form-group"><label>Дата подачи</label><input type="date" id="tSubDate"></div>
    <div class="form-group"><label>Начальная цена</label><input type="number" id="tStartPrice"></div>
    <div class="form-group"><label>Наша цена</label><input type="number" id="tOurPrice"></div>
    <button class="btn btn-primary btn-full" onclick="saveTender()">💾 Сохранить</button>
  `);
}

async function saveTender() {
  const res = await api('createTender', {
    name: val('tName'), customer: val('tCustomer'), noticeNumber: val('tNotice'),
    publishDate: val('tPubDate'), submissionDate: val('tSubDate'), startPrice: val('tStartPrice'), ourPrice: val('tOurPrice')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openTenderDocModal(tenderId) {
  openModalHtml(`
    <h2>📄 Документ тендера</h2>
    <input type="hidden" id="tDocId" value="${tenderId}">
    <div class="form-group"><label>Тип</label><input type="text" id="tDocType"></div>
    <div class="form-group"><label>Наименование</label><input type="text" id="tDocName"></div>
    <div class="form-group"><label>Файл</label><input type="file" id="tDocFile"></div>
    <button class="btn btn-primary btn-full" onclick="saveTenderDoc()">💾 Сохранить</button>
  `);
}

async function saveTenderDoc() {
  const file = document.getElementById('tDocFile').files[0];
  if (!file) return alert('Выберите файл');
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    const uploaded = await api('universalUpload', {
      module: 'Тендеры', recordId: val('tDocId'),
      fileName: file.name, mimeType: file.type, fileData: e.target.result.split(',')[1]
    });
    const res = await api('addTenderDoc', {
      tenderId: val('tDocId'), docType: val('tDocType'), name: val('tDocName'),
      fileUrl: uploaded.fileUrl || '', fileId: uploaded.fileId || ''
    });
    if (res.success) { closeModal('universalModal'); loadData(); }
    else alert('Ошибка: ' + res.error);
  };
  reader.readAsDataURL(file);
}

async function deleteTender(id) {
  if (!confirm('Удалить тендер?')) return;
  const res = await api('deleteTender', { tenderId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openKPModal() {
  openModalHtml(`
    <h2>💼 Коммерческое предложение</h2>
    <div class="form-group"><label>Номер КП</label><input type="text" id="kpNumber"></div>
    <div class="form-group"><label>Дата</label><input type="date" id="kpDate"></div>
    <div class="form-group"><label>Заказчик</label><input type="text" id="kpCustomer"></div>
    <div class="form-group"><label>Объект</label><input type="text" id="kpObject"></div>
    <div class="form-group"><label>Сумма</label><input type="number" id="kpAmount"></div>
    <button class="btn btn-primary btn-full" onclick="saveKP()">💾 Сохранить</button>
  `);
}

async function saveKP() {
  const res = await api('createKP', {
    kpNumber: val('kpNumber'), date: val('kpDate'),
    customer: val('kpCustomer'), object: val('kpObject'), amount: val('kpAmount')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteKP(id) {
  if (!confirm('Удалить КП?')) return;
  const res = await api('deleteKP', { kpId: id });
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
    fio: val('pFio'), position: val('pPos'), tabelNumber: val('pTab'),
    phone: val('pPhone'), email: val('pEmail'), hireDate: val('pDate')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openPersonDocModal(personId) {
  openModalHtml(`
    <h2>📄 Документ сотрудника</h2>
    <input type="hidden" id="pDocId" value="${personId}">
    <div class="form-group"><label>Тип</label>
      <select id="pDocType"><option>Паспорт</option><option>Диплом</option><option>Медкнижка</option><option>Допуск</option></select>
    </div>
    <div class="form-group"><label>Номер</label><input type="text" id="pDocNum"></div>
    <div class="form-group"><label>Срок действия</label><input type="date" id="pDocExp"></div>
    <div class="form-group"><label>Файл</label><input type="file" id="pDocFile"></div>
    <button class="btn btn-primary btn-full" onclick="savePersonDoc()">💾 Сохранить</button>
  `);
}

async function savePersonDoc() {
  const file = document.getElementById('pDocFile').files[0];
  const res = await api('addPersonDoc', {
    personId: val('pDocId'), docType: val('pDocType'), number: val('pDocNum'), expiryDate: val('pDocExp')
  });
  if (res.success && file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const uploaded = await api('universalUpload', {
        module: 'Персонал', recordId: val('pDocId'),
        fileName: file.name, mimeType: file.type, fileData: e.target.result.split(',')[1]
      });
      await api('patchRecord', {
        sheetName: 'Персонал_Документы', recordId: res.docId,
        fields: { 'Ссылка': uploaded.fileUrl, 'FileID': uploaded.fileId }
      });
    };
    reader.readAsDataURL(file);
  }
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deletePerson(id) {
  if (!confirm('Удалить сотрудника?')) return;
  const res = await api('deletePerson', { personId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openGenericModal(key) {
  const configs = {
    'orders': { title: 'Приказ', fields: [['number','Номер'],['date','Дата','date'],['type','Тип'],['employee','Сотрудник'],['content','Содержание','textarea']] },
    'ppr': { title: 'ППР/Техкарта', fields: [['contractId','Договор','contract'],['type','Тип'],['name','Название'],['number','Номер']] },
    'prescriptions': { title: 'Предписание', fields: [['contractId','Договор','contract'],['type','Тип'],['number','Номер'],['date','Дата','date'],['from','От кого'],['content','Содержание','textarea'],['dueDate','Срок','date']] },
    'approvals': { title: 'Согласование', fields: [['contractId','Договор','contract'],['type','Тип'],['name','Название'],['withWhom','С кем'],['letterNumber','Номер письма']] },
    'daily': { title: 'Ежедневный отчёт', fields: [['contractId','Договор','contract'],['date','Дата','date'],['foreman','Прораб'],['weather','Погода'],['workforce','Численность'],['completed','Выполнено','textarea'],['problems','Проблемы','textarea']] },
    'workorders': { title: 'Наряд-задание', fields: [['contractId','Договор','contract'],['number','Номер'],['date','Дата','date'],['brigade','Бригада'],['workType','Вид работ'],['volume','Объём','number']] },
    'workforce': { title: 'Численность', fields: [['contractId','Договор','contract'],['date','Дата','date'],['profession','Профессия'],['quantity','Количество','number'],['foreman','Мастер']] },
    'materials': { title: 'Материал', fields: [['contractId','Договор','contract'],['name','Наименование'],['supplier','Поставщик'],['quantity','Количество','number'],['unit','Ед.изм']] },
    'reminders': { title: 'Напоминание', fields: [['type','Тип'],['object','Объект'],['description','Описание','textarea'],['date','Дата','date'],['responsible','Ответственный']] },
    'calendar': { title: 'Событие', fields: [['date','Дата','date'],['type','Тип'],['object','Объект'],['description','Описание','textarea'],['responsible','Ответственный']] }
  };
  
  const cfg = configs[key];
  if (!cfg) return;
  
  let html = `<h2>➕ ${cfg.title}</h2>`;
  cfg.fields.forEach(([name,label,type]) => {
    const id = 'gen_' + name;
    if (type === 'date') html += `<div class="form-group"><label>${label}</label><input type="date" id="${id}"></div>`;
    else if (type === 'contract') html += `<div class="form-group"><label>${label}</label><select id="${id}">${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`).join('')}</select></div>`;
    else if (type === 'textarea') html += `<div class="form-group"><label>${label}</label><textarea id="${id}"></textarea></div>`;
    else html += `<div class="form-group"><label>${label}</label><input type="text" id="${id}"></div>`;
  });
  html += `<button class="btn btn-primary btn-full" onclick="saveGeneric('${key}')">💾 Сохранить</button>`;
  openModalHtml(html);
}

async function saveGeneric(key) {
  const actions = {
    'orders': 'createOrder', 'ppr': 'createPPR', 'prescriptions': 'createPrescription',
    'approvals': 'createApproval', 'daily': 'createDailyReport', 'workorders': 'createWorkOrder',
    'workforce': 'addWorkforce', 'materials': 'addMaterial', 'reminders': 'addReminder', 'calendar': 'addCalendarEvent'
  };
  
  const fieldMappings = {
    'orders': [['number','number'],['date','date'],['type','type'],['employee','employee'],['content','content']],
    'ppr': [['contractId','contractId'],['type','type'],['name','name'],['number','number']],
    'prescriptions': [['contractId','contractId'],['type','type'],['number','number'],['date','date'],['from','from'],['content','content'],['dueDate','dueDate']],
    'approvals': [['contractId','contractId'],['type','type'],['name','name'],['withWhom','withWhom'],['letterNumber','letterNumber']],
    'daily': [['contractId','contractId'],['date','date'],['foreman','foreman'],['weather','weather'],['workforce','workforce'],['completed','completed'],['problems','problems']],
    'workorders': [['contractId','contractId'],['number','number'],['date','date'],['brigade','brigade'],['workType','workType'],['volume','volume']],
    'workforce': [['contractId','contractId'],['date','date'],['profession','profession'],['quantity','quantity'],['foreman','foreman']],
    'materials': [['contractId','contractId'],['name','name'],['supplier','supplier'],['quantity','quantity'],['unit','unit']],
    'reminders': [['type','type'],['object','object'],['description','description'],['date','date'],['responsible','responsible']],
    'calendar': [['date','date'],['type','type'],['object','object'],['description','description'],['responsible','responsible']]
  };
  
  const payload = {};
  fieldMappings[key].forEach(([fieldName, param]) => {
    if (fieldName === 'contractId') {
      payload.contractId = val('gen_contractId') || 'ОБЪ-001';
    } else {
      payload[fieldName] = val('gen_' + fieldName);
    }
  });
  
  const res = await api(actions[key], payload);
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteGeneric(key, id) {
  if (!confirm('Удалить запись?')) return;
  const idFields = {
    'orders': 'orderId', 'planning': 'pprId', 'prescriptions': 'prescriptionId',
    'approvals': 'approvalId', 'daily': 'reportId', 'workorders': 'workOrderId',
    'workforce': 'workforceId', 'materials': 'materialId', 'reminders': 'reminderId'
  };
  const actions = {
    'orders': 'deleteOrder', 'planning': 'deletePPR', 'prescriptions': 'deletePrescription',
    'approvals': 'deleteApproval', 'daily': 'deleteDailyReport', 'workorders': 'deleteWorkOrder',
    'workforce': 'deleteWorkforce', 'materials': 'deleteMaterial', 'reminders': 'deleteReminder'
  };
  const payload = {};
  payload[idFields[key]] = id;
  const res = await api(actions[key], payload);
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openObjectModal() {
  openModalHtml(`
    <h2>🏗️ Объект</h2>
    <div class="form-group"><label>Название</label><input type="text" id="objName"></div>
    <div class="form-group"><label>Адрес</label><input type="text" id="objAddr"></div>
    <div class="form-group"><label>Заказчик</label><input type="text" id="objCust"></div>
    <div class="form-group"><label>Тип</label><select id="objType"><option>ОКН</option><option>Новое строительство</option><option>Реконструкция</option></select></div>
    <button class="btn btn-primary btn-full" onclick="saveObject()">💾 Сохранить</button>
  `);
}

async function saveObject() {
  const res = await api('createObject', {
    name: val('objName'), address: val('objAddr'), customer: val('objCust'), objectType: val('objType')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
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
    to: val('taskTo'), subject: val('taskSubj'), description: val('taskDesc'),
    deadline: val('taskDead'), priority: val('taskPrio')
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
    ${replies.map(r => `
      <div class="card" style="margin-bottom:8px;">
        <div class="card-meta"><b>${r['От_кого']}</b> | ${r['Время']}<br>${r['Текст']}</div>
      </div>
    `).join('') || '<p>Нет ответов</p>'}
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
    <div class="form-group"><label>Договор</label><select id="estContract">${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}">${c['Контрагент']}</option>`).join('')}</select></div>
    <div class="form-group"><label>Название</label><input type="text" id="estName"></div>
    <div class="form-group"><label>Сумма</label><input type="number" id="estAmount"></div>
    <button class="btn btn-primary btn-full" onclick="saveEstimate()">💾 Сохранить</button>
  `);
}

async function saveEstimate() {
  const res = await api('createEstimate', {
    contractId: val('estContract'), name: val('estName'), totalAmount: val('estAmount')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openEstimateItemModal(estimateId) {
  openModalHtml(`
    <h2>📝 Позиция сметы</h2>
    <input type="hidden" id="estItemId" value="${estimateId}">
    <div class="form-group"><label>Раздел</label>
      <select id="estSection">
        <option value="ПР">ПР — Подготовительные</option>
        <option value="ДМ">ДМ — Демонтажные</option>
        <option value="СТ">СТ — Стены</option>
        <option value="КР">КР — Кровля</option>
        <option value="ОИ">ОИ — Интерьеры</option>
      </select>
    </div>
    <div class="form-group"><label>Наименование</label><input type="text" id="estItemName"></div>
    <div class="form-group"><label>Ед. изм.</label><input type="text" id="estItemUnit" value="м2"></div>
    <div class="form-group"><label>Количество</label><input type="number" id="estItemQty"></div>
    <div class="form-group"><label>Цена</label><input type="number" id="estItemPrice"></div>
    <button class="btn btn-primary btn-full" onclick="saveEstimateItem()">💾 Сохранить</button>
  `);
}

async function saveEstimateItem() {
  const res = await api('addEstimateItem', {
    estimateId: val('estItemId'), section: val('estSection'), name: val('estItemName'),
    unit: val('estItemUnit'), quantity: val('estItemQty'), price: val('estItemPrice')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function viewEstimate(id) {
  const res = await api('getEstimateFull', { estimateId: id });
  if (!res.success) return alert('Ошибка: ' + res.error);
  
  const positions = res.positions || [];
  let html = `<h2>📊 Позиции сметы</h2>`;
  html += positions.map(p => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${p['Наименование']}</div>
          <div class="card-meta">${p['Количество']} ${p['Ед_изм']} × ${money(p['Цена'])} = ${money(p['Сумма'])}<br>Статус: ${p['Статус']} | Закрыто: ${p['Закрыто_объём']}</div>
        </div>
      </div>
    </div>
  `).join('');
  openModalHtml(html);
}

async function deleteEstimate(id) {
  if (!confirm('Удалить смету?')) return;
  const res = await api('deleteEstimate', { estimateId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openContractorModal(id = null) {
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
    name: val('cName'), inn: val('cInn'), contactPerson: val('cContact'),
    phone: val('cPhone'), email: val('cEmail')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteContractor(id) {
  if (!confirm('Удалить подрядчика?')) return;
  const res = await api('deleteContractor', { contractorId: id });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

function openContractorWorkModal(workId = null, contractorId = null) {
  openModalHtml(`
    <h2>🔨 Работа подрядчика</h2>
    <input type="hidden" id="cwId" value="${workId || ''}">
    <div class="form-group"><label>Подрядчик</label>
      <select id="cwContractor">${(allData.contractors || []).map(c => `<option value="${c['ID']}" ${c['ID'] === contractorId ? 'selected' : ''}>${c['Название']}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>Вид работ</label><input type="text" id="cwType"></div>
    <div class="form-group"><label>Договорной объём</label><input type="number" id="cwVol"></div>
    <div class="form-group"><label>Цена за ед.</label><input type="number" id="cwPrice"></div>
    <button class="btn btn-primary btn-full" onclick="saveContractorWork()">💾 Сохранить</button>
  `);
}

async function saveContractorWork() {
  const res = await api('createContractorWork', {
    contractorId: val('cwContractor'), workType: val('cwType'), volume: val('cwVol'), price: val('cwPrice'), unit: 'м2'
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function viewContractor(id) {
  const res = await api('getContractorSummary', { contractorId: id });
  if (!res.success) return alert('Ошибка: ' + res.error);
  
  const c = res.contractor;
  const s = res.summary;
  const works = res.works;
  
  let html = `
    <h2>🏢 ${c['Название']}</h2>
    <div class="stats">
      <div class="stat-box"><div class="stat-number">${money(s.totalContract)}</div><div class="stat-label">Договорная сумма</div></div>
      <div class="stat-box"><div class="stat-number">${money(s.totalClosed)}</div><div class="stat-label">Закрыто</div></div>
      <div class="stat-box"><div class="stat-number">${money(s.totalPaid)}</div><div class="stat-label">Выплачено</div></div>
      <div class="stat-box"><div class="stat-number" style="color:${s.totalBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">${money(s.totalBalance)}</div><div class="stat-label">${s.totalBalance >= 0 ? 'К выплате' : 'Переплата'}</div></div>
    </div>
    <h3>🔨 Работы</h3>
    ${works.map(w => `
      <div class="card" style="margin-bottom:8px;">
        <div class="card-header">
          <div>
            <div class="card-title">${w['Вид_работ']}</div>
            <div class="card-meta">Объём: ${w['Закрыто_объём']} / ${w['Договорной_объём']} ${w['Ед_изм']} | Сумма: ${money(w['Сумма_закрытая'])} / ${money(w['Сумма_договорная'])}</div>
          </div>
        </div>
      </div>
    `).join('')}
  `;
  openModalHtml(html);
}

function openSubmitVolumeModal(contractId = '') {
  openModalHtml(`
    <h2>📊 Подать объём на проверку</h2>
    <div class="form-group"><label>Договор</label>
      <select id="svContract" onchange="updateSubmitPositions()">
        <option value="">Выберите</option>
        ${(allData.contracts || []).map(c => `<option value="${c['ID_Договора']}" ${c['ID_Договора'] === contractId ? 'selected' : ''}>${c['Контрагент']}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>Позиция</label><select id="svPosition"></select></div>
    <div class="form-group"><label>Объём</label><input type="number" id="svVolume"></div>
    <div class="form-group"><label>Комментарий</label><textarea id="svComment"></textarea></div>
    <button class="btn btn-primary btn-full" onclick="submitVolume()">📤 Подать</button>
  `);
  updateSubmitPositions();
}

function updateSubmitPositions() {
  const contractId = val('svContract');
  const estimates = (allData.estimates || []).filter(e => e['ID_Договора'] === contractId);
  const ids = estimates.map(e => e['ID_Сметы']);
  const positions = (allData.estimateItems || []).filter(p => ids.includes(p['ID_Сметы']));
  document.getElementById('svPosition').innerHTML = positions.map(p => `<option value="${p['ID_Позиции']}">${p['Наименование']} — ${p['Количество']} ${p['Ед_изм']}</option>`).join('');
}

async function submitVolume() {
  const res = await api('submitVolume', {
    contractId: val('svContract'), positionId: val('svPosition'),
    volume: val('svVolume'), comment: val('svComment')
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
    contractId: val('ks2cContract'), ks2Number: val('ks2cNumber'), date: val('ks2cDate'),
    period: val('ks2cPeriod'), totalAmount: val('ks2cAmount'), positions: []
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
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
        <option>Тендерный_специалист</option>
        <option>Отдел_кадров</option>
      </select>
    </div>
    <div class="form-group"><label>Email</label><input type="email" id="uEmail"></div>
    <button class="btn btn-primary btn-full" onclick="saveUser()">✅ Создать</button>
  `);
}

async function saveUser() {
  const res = await api('createUser', {
    adminLogin: currentUser.login,
    login: val('uLogin'), password: val('uPass'), fio: val('uFio'),
    role: val('uRole'), email: val('uEmail'), access: 'Полный'
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

async function deleteUser(login) {
  if (!confirm('Удалить пользователя?')) return;
  const res = await api('deleteUser', { adminLogin: currentUser.login, login });
  if (res.success) loadData(); else alert('Ошибка: ' + res.error);
}

async function loadTrash() {
  const res = await api('getTrash');
  if (!res.success) return;
  
  const el = document.getElementById('trashList');
  if (!el) return;
  
  let html = '';
  Object.entries(res.trash).forEach(([sheet, items]) => {
    html += `<div class="card"><h3>${sheet} (${items.length})</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Название</th><th>Действия</th></tr></thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.id}</td>
              <td>${item.display}</td>
              <td>
                <button class="btn btn-small btn-success" onclick="restoreItem('${sheet}', '${item.id}', '${item.idField}')">✅ Восстановить</button>
                <button class="btn btn-small btn-danger" onclick="permDeleteItem('${sheet}', '${item.id}', '${item.idField}')">🗑️ Навсегда</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table></div></div>
    `;
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
  
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Сущность</th><th>Детали</th></tr></thead>
        <tbody>
          ${(res.history || []).map(h => `<tr><td>${h['Дата']}</td><td>${h['Пользователь']}</td><td>${h['Действие']}</td><td>${h['Сущность']}</td><td>${h['Комментарий'] || ''}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openEmailSettingsModal() {
  openModalHtml(`
    <h2>📧 Email-уведомления</h2>
    <div class="form-group"><label>Ваш Email</label><input type="email" id="emailAddr" value="${currentUser.email || ''}"></div>
    <button class="btn btn-primary btn-full" onclick="saveEmailSettings()">💾 Сохранить</button>
    <button class="btn btn-info btn-full" style="margin-top:8px;" onclick="testEmail()">🧪 Тест</button>
  `);
}

async function saveEmailSettings() {
  const res = await api('saveUserEmail', { login: currentUser.login, email: val('emailAddr'), subscriptions: 'Документы,Замечания,Напоминания,Договоры,Сроки' });
  if (res.success) { closeModal('universalModal'); alert('Сохранено'); }
  else alert('Ошибка: ' + res.error);
}

async function testEmail() {
  const res = await api('testEmail', { email: val('emailAddr') });
  if (res.success) alert('Письмо отправлено');
  else alert('Ошибка: ' + res.error);
}

function exportData() {
  const type = prompt('Что экспортировать? (contracts, documents, materials, reminders, personnel, tenders, ks2)', 'contracts');
  if (!type) return;
  
  api('exportCSV', { type }).then(res => {
    if (res.success) window.open(res.fileUrl, '_blank');
    else alert('Ошибка: ' + res.error);
  });
}

let searchDebounce = null;
function handleGlobalSearch(query) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => performGlobalSearch(query.trim()), 300);
}

function showSearchResults() {
  const el = document.getElementById('searchResults');
  if (el.innerHTML) el.classList.add('active');
}

function hideSearchResults() {
  setTimeout(() => document.getElementById('searchResults').classList.remove('active'), 200);
}

function performGlobalSearch(query) {
  if (!query || query.length < 2) {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResults').classList.remove('active');
    return;
  }
  
  const q = query.toLowerCase();
  const results = [];
  
  (allData.contracts || []).forEach(c => {
    if (String(c['Контрагент'] || '').toLowerCase().includes(q)) results.push({ type: 'Договор', text: c['Контрагент'], action: `switchTabDirect('contracts')` });
  });
  (allData.personnel || []).forEach(p => {
    if (String(p['ФИО'] || '').toLowerCase().includes(q)) results.push({ type: 'Сотрудник', text: p['ФИО'], action: `switchTabDirect('personnel')` });
  });
  (allData.tenders || []).forEach(t => {
    if (String(t['Название'] || '').toLowerCase().includes(q)) results.push({ type: 'Тендер', text: t['Название'], action: `switchTabDirect('tenders')` });
  });
  
  const el = document.getElementById('searchResults');
  if (results.length === 0) {
    el.innerHTML = '<div class="search-empty">Ничего не найдено</div>';
  } else {
    el.innerHTML = `<div class="search-group-title">Найдено: ${results.length}</div>` +
      results.slice(0, 10).map(r => `
        <div class="search-item" onclick="${r.action}; hideSearchResults();">
          <div class="search-item-title">${r.type}: ${r.text}</div>
        </div>
      `).join('');
  }
  el.classList.add('active');
}

function updateMobileNav() {
  const active = document.querySelector('.tab.active');
  if (!active) return;
  const id = active.dataset.tab;
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${id}'`)) item.classList.add('active');
  });
}

function mobileQuickAction() {
  const active = document.querySelector('.tab.active');
  if (!active) return;
  const id = active.dataset.tab;
  const actions = {
    'contracts': () => openContractModal(),
    'submissions': () => openSubmitVolumeModal(),
    'tasks': () => openTaskModal(),
    'estimates': () => openEstimateModal()
  };
  if (actions[id]) actions[id]();
}

let touchStartX = 0;
let touchEndX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  const diff = touchEndX - touchStartX;
  if (Math.abs(diff) < 80) return;
  
  const tabs = Array.from(document.querySelectorAll('.tab')).filter(t => t.style.display !== 'none');
  const idx = tabs.findIndex(t => t.classList.contains('active'));
  if (diff > 0 && idx > 0) tabs[idx - 1].click();
  else if (diff < 0 && idx < tabs.length - 1) tabs[idx + 1].click();
});

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch').focus();
  }
  if (e.key === 'Escape') {
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('globalSearch').blur();
    closeModal('universalModal');
  }
});

async function renderContractProgress() {
  const contractId = val('progressContractFilter');
  if (!contractId) return;
  
  const res = await api('getContractProgress', { contractId });
  if (!res.success) return alert('Ошибка: ' + res.error);
  
  const summary = res.summary;
  const s = document.getElementById('progressSummary');
  if (s) {
    s.innerHTML = `
      <div class="stat-box"><div class="stat-number">${summary.totalVolume}</div><div class="stat-label">Всего объёма</div></div>
      <div class="stat-box"><div class="stat-number">${summary.approvedExecuted}</div><div class="stat-label">Выполнено</div></div>
      <div class="stat-box"><div class="stat-number">${summary.onReview}</div><div class="stat-label">На проверке</div></div>
      <div class="stat-box"><div class="stat-number">${summary.ks2Count}</div><div class="stat-label">КС-2</div></div>
    `;
  }
  
  const positions = res.positions || [];
  const list = document.getElementById('progressPositionsList');
  if (list) {
    list.innerHTML = positions.map(p => `
      <div class="card">
        <div class="card-title">${p.name}</div>
        <div class="card-meta">Всего: ${p.totalVolume} ${p.unit} | ${money(p.totalAmount)}</div>
        <div style="margin-top:10px;">
          <div class="progress-bar-container">
            <div class="segment seg-green" style="width:${(p.approvedExecuted/p.totalVolume*100)||0}%">${p.approvedExecuted}</div>
            <div class="segment seg-yellow" style="width:${(p.onReview/p.totalVolume*100)||0}%">${p.onReview}</div>
            <div class="segment seg-gray" style="width:${(p.executionRemaining/p.totalVolume*100)||0}%">${p.executionRemaining}</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function viewArchProject(id) {
  const p = (allData.archProjects || []).find(x => x['ID_Проекта'] === id);
  if (!p) return;
  openModalHtml(`
    <h2>🏛️ ${p['Название']}</h2>
    <div class="card">
      <div class="card-meta">
        <b>Тип:</b> ${p['Тип']}<br>
        <b>Автор:</b> ${p['Автор']}<br>
        <b>Версия:</b> ${p['Версия']}<br>
        <b>Дата:</b> ${p['Дата_создания']}<br>
        ${p['Примечание'] ? '<b>Примечание:</b> ' + p['Примечание'] : ''}
      </div>
    </div>
    ${p['Ссылка_на_папку'] ? `<a href="${p['Ссылка_на_папку']}" target="_blank" class="btn btn-info">📁 Открыть папку</a>` : ''}
  `);
}

function openDrawingModal(projectId) {
  openModalHtml(`
    <h2>📐 Добавить чертёж</h2>
    <input type="hidden" id="drProjectId" value="${projectId}">
    <div class="form-group"><label>Шифр</label>
      <select id="drCode"><option>АР</option><option>КР</option><option>КЖ</option><option>ОВ</option><option>ВК</option><option>ЭОМ</option></select>
    </div>
    <div class="form-group"><label>Название</label><input type="text" id="drName"></div>
    <div class="form-group"><label>Масштаб</label><input type="text" id="drScale"></div>
    <div class="form-group"><label>Лист</label><input type="text" id="drSheet"></div>
    <button class="btn btn-primary btn-full" onclick="saveDrawing()">💾 Сохранить</button>
  `);
}

async function saveDrawing() {
  const res = await api('addDrawing', {
    projectId: val('drProjectId'), code: val('drCode'), name: val('drName'),
    scale: val('drScale'), sheet: val('drSheet'), format: 'А3'
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openPreservationModal(projectId) {
  openModalHtml(`
    <h2>🏛️ Предмет охраны</h2>
    <input type="hidden" id="prProjectId" value="${projectId}">
    <div class="form-group"><label>Название</label><input type="text" id="prName"></div>
    <div class="form-group"><label>Тип</label>
      <select id="prType"><option>Фасад</option><option>Интерьер</option><option>Декор</option><option>Лепнина</option><option>Роспись</option></select>
    </div>
    <div class="form-group"><label>Местоположение</label><input type="text" id="prLoc"></div>
    <div class="form-group"><label>Описание</label><textarea id="prDesc"></textarea></div>
    <button class="btn btn-primary btn-full" onclick="savePreservation()">💾 Сохранить</button>
  `);
}

async function savePreservation() {
  const res = await api('addPreservationItem', {
    projectId: val('prProjectId'), name: val('prName'), type: val('prType'),
    location: val('prLoc'), description: val('prDesc')
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

function openSupervisionModal(projectId) {
  openModalHtml(`
    <h2>🔍 Замечание авторского надзора</h2>
    <input type="hidden" id="supProjectId" value="${projectId}">
    <div class="form-group"><label>Дата</label><input type="date" id="supDate"></div>
    <div class="form-group"><label>Описание</label><textarea id="supDesc"></textarea></div>
    <div class="form-group"><label>Исполнитель</label>
      <select id="supResp">${(allData.users || []).map(u => `<option value="${u['Логин']}">${u['ФИО']}</option>`).join('')}</select>
    </div>
    <button class="btn btn-primary btn-full" onclick="saveSupervision()">💾 Сохранить</button>
  `);
}

async function saveSupervision() {
  const res = await api('addAuthorSupervision', {
    projectId: val('supProjectId'), date: val('supDate'),
    description: val('supDesc'), responsible: val('supResp'), author: currentUser.fio
  });
  if (res.success) { closeModal('universalModal'); loadData(); }
  else alert('Ошибка: ' + res.error);
}

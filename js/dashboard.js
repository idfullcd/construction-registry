import { sendRequest, checkAccess } from './api.js';
import { state, MENU_ITEMS, roleBadge } from './config.js';
import { loadUsersTab } from './users.js';
import { loadContractsTab } from './contracts.js';
import { loadMatrixTab, loadLogsTab, loadHistoryTab, loadTrashTab } from './admin.js';

export function showApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    
    // Заполняем карточку пользователя
    document.getElementById('userName').textContent = state.currentUser.username;
    document.getElementById('userRole').innerHTML = roleBadge(state.currentUser.role);
    
    // Загружаем метаданные параллельно
    Promise.all([
        sendRequest('getContractMeta', {}),
        sendRequest('getMatrix', {})
    ]).then(([metaRes, matrixRes]) => {
        if (metaRes.success) state.contractMeta = metaRes;
        if (matrixRes.success) state.matrixData = matrixRes;
        renderMenu();
        navigateTo('contracts');
    });
}

export function renderMenu() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    
    const isAdmin = state.currentUser.role === 'Администратор';
    
    MENU_ITEMS.forEach(item => {
        // Пропускаем пункты без доступа
        if (item.adminOnly && !isAdmin) return;
        if (!item.adminOnly && !checkAccess(item.section, item.action, state.currentUser, state.matrixData)) {
            return;
        }
        
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.dataset.section = item.id;
        btn.innerHTML = `
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-text">${item.title}</span>
        `;
        btn.onclick = () => navigateTo(item.id);
        nav.appendChild(btn);
    });
}

export function navigateTo(sectionId) {
    state.currentSection = sectionId;
    
    // Подсветка активного пункта
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Заголовок страницы
    const menuItem = MENU_ITEMS.find(m => m.id === sectionId);
    document.getElementById('pageTitle').textContent = menuItem ? `${menuItem.icon} ${menuItem.title}` : sectionId;
    
    // Загрузка контента
    const area = document.getElementById('contentArea');
    area.innerHTML = '<p style="text-align:center; padding:30px;">Загрузка...</p>';
    
    switch (sectionId) {
        case 'contracts': loadContractsTab(); break;
        case 'documents': loadPlaceholder('📁', 'Документация', 'Раздел в разработке'); break;
        case 'finance': loadPlaceholder('💰', 'Финансы', 'Раздел в разработке'); break;
        case 'reports': loadPlaceholder('📊', 'Отчёты', 'Раздел в разработке'); break;
        case 'users': loadUsersTab(); break;
        case 'matrix': loadMatrixTab(); break;
        case 'logs': loadLogsTab(); break;
        case 'history': loadHistoryTab(); break;
        case 'trash': loadTrashTab(); break;
    }
}

function loadPlaceholder(icon, title, text) {
    document.getElementById('contentArea').innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
            <div style="font-size:64px;">${icon}</div>
            <h2 style="margin:20px 0;">${title}</h2>
            <p style="color:#666;">${text}</p>
        </div>
    `;
}

export function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// Делаем функции глобальными для onclick в HTML
window.toggleSidebar = toggleSidebar;
window.navigateTo = navigateTo;

import { sendRequest, checkAccess } from './api.js';
import { state, MENU_ITEMS, roleBadge, escapeHtml } from './config.js';
import { loadUsersTab } from './users.js';
import { loadContractsTab } from './contracts.js';
import { loadMatrixTab, loadLogsTab, loadHistoryTab, loadTrashTab } from './admin.js';

export function showApp() {
    console.log('[Dashboard] showApp called, user:', state.currentUser?.username, 'role:', state.currentUser?.role);
    
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('userName').textContent = state.currentUser.username;
    document.getElementById('userRole').innerHTML = roleBadge(state.currentUser.role);

    document.getElementById('contentArea').innerHTML = '<p style="text-align:center; padding:30px;">Загрузка данных...</p>';

    Promise.all([
        sendRequest('getContractMeta', {}).catch(e => ({ success: false, error: e.message })),
        sendRequest('getMatrix', {}).catch(e => ({ success: false, error: e.message }))
    ]).then(([metaRes, matrixRes]) => {
        console.log('[Dashboard] Loaded:', { meta: metaRes.success, matrix: matrixRes.success });
        
        if (metaRes.success) state.contractMeta = metaRes;
        if (matrixRes.success) state.matrixData = matrixRes;
        
        if (!matrixRes.success) {
            document.getElementById('contentArea').innerHTML = `
                <div style="text-align:center; padding:40px;">
                    <div style="font-size:64px;">⚠️</div>
                    <h3 style="color:#dc3545; margin:20px 0;">Ошибка загрузки</h3>
                    <p>Не удалось загрузить права доступа.</p>
                    <p style="color:#666; font-size:14px; margin-top:10px;">${escapeHtml(matrixRes.error)}</p>
                    <div style="margin-top:20px;">
                        <button class="btn btn-primary" onclick="location.reload()">🔄 Обновить страницу</button>
                        <button class="btn btn-secondary" onclick="window._logout()" style="margin-left:10px;">🚪 Выйти</button>
                    </div>
                </div>
            `;
            return;
        }
        
        renderMenu();
        
        const first = document.querySelector('.nav-item');
        if (first) {
            navigateTo(first.dataset.section);
        } else {
            document.getElementById('contentArea').innerHTML = `
                <div style="text-align:center; padding:60px 20px;">
                    <div style="font-size:64px;">🔒</div>
                    <h2 style="margin:20px 0;">Нет доступных разделов</h2>
                    <p style="color:#666;">У вашей роли (${escapeHtml(state.currentUser.role)}) нет прав.</p>
                    <button class="btn btn-secondary" onclick="window._logout()" style="margin-top:20px;">🚪 Выйти</button>
                </div>
            `;
        }
    }).catch(error => {
        document.getElementById('contentArea').innerHTML = `
            <div style="text-align:center; padding:40px;">
                <div style="font-size:64px;">⚠️</div>
                <h3 style="color:#dc3545; margin:20px 0;">Критическая ошибка</h3>
                <p>${escapeHtml(error.message || 'Неизвестная ошибка')}</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top:20px;">🔄 Обновить страницу</button>
            </div>
        `;
    });
}

export function renderMenu() {
    console.log('[Dashboard] renderMenu called, role:', state.currentUser.role);
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    
    const isAdmin = state.currentUser.role === 'Администратор';
    
    // Разделяем пункты на обычные и админские
    const regularItems = MENU_ITEMS.filter(item => !item.adminOnly);
    const adminItems = MENU_ITEMS.filter(item => item.adminOnly);
    
    // ===== ОБЫЧНЫЕ ПУНКТЫ =====
    let regularCount = 0;
    regularItems.forEach(item => {
        // Главная доступна всем
        if (item.isHome) {
            appendNavItem(nav, item);
            regularCount++;
            return;
        }
        // Для остальных проверяем права
        if (checkAccess(item.section, item.action)) {
            appendNavItem(nav, item);
            regularCount++;
        }
    });
    
    console.log('[Dashboard] Regular items:', regularCount);
    
    // ===== АДМИНСКАЯ СЕКЦИЯ (только для администратора) =====
    if (isAdmin && adminItems.length > 0) {
        // Разделитель с заголовком
        const divider = document.createElement('div');
        divider.className = 'nav-divider';
        divider.innerHTML = `
            <div class="nav-divider-line"></div>
            <div class="nav-divider-label">
                <span class="nav-divider-icon">🛡️</span>
                <span class="nav-divider-text">АДМИНИСТРИРОВАНИЕ</span>
            </div>
            <div class="nav-divider-line"></div>
        `;
        nav.appendChild(divider);
        
        // Админские пункты
        adminItems.forEach(item => {
            appendNavItem(nav, item, true);
        });
        
        console.log('[Dashboard] Admin items:', adminItems.length);
    }
}

function appendNavItem(nav, item, isAdminItem = false) {
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (isAdminItem ? ' nav-item-admin' : '');
    btn.dataset.section = item.id;
    btn.innerHTML = `
        <span class="nav-icon">${escapeHtml(item.icon)}</span>
        <span class="nav-text">${escapeHtml(item.title)}</span>
    `;
    btn.onclick = () => navigateTo(item.id);
    nav.appendChild(btn);
}

export function navigateTo(sectionId) {
    console.log('[Dashboard] navigateTo:', sectionId);
    state.currentSection = sectionId;
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    const menuItem = MENU_ITEMS.find(m => m.id === sectionId);
    document.getElementById('pageTitle').textContent = menuItem ? `${menuItem.icon} ${menuItem.title}` : sectionId;
    
    const area = document.getElementById('contentArea');
    area.innerHTML = '<p style="text-align:center; padding:30px;">Загрузка...</p>';
    
    switch (sectionId) {
        case 'home': loadHomePage(); break;
        case 'contracts': loadContractsTab(); break;
        case 'documents': loadPlaceholder('📁', 'Документация', 'Раздел в разработке'); break;
        case 'finance': loadPlaceholder('💰', 'Финансы', 'Раздел в разработке'); break;
        case 'reports': loadPlaceholder('📊', 'Отчёты', 'Раздел в разработке'); break;
        case 'users': loadUsersTab(); break;
        case 'matrix': loadMatrixTab(); break;
        case 'logs': loadLogsTab(); break;
        case 'history': loadHistoryTab(); break;
        case 'trash': loadTrashTab(); break;
        default: loadPlaceholder('🚧', 'Раздел', 'Не найден');
    }
}

function loadHomePage() {
    const area = document.getElementById('contentArea');
    const user = state.currentUser;
    const isAdmin = user.role === 'Администратор';
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const hour = now.getHours();
    let greeting = 'Добрый день';
    if (hour < 6) greeting = 'Доброй ночи';
    else if (hour < 12) greeting = 'Доброе утро';
    else if (hour >= 18) greeting = 'Добрый вечер';
    
    let html = `
        <div style="max-width: 1000px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 10px 0;">${greeting}, ${escapeHtml(user.username)}! 👋</h2>
                <p style="margin: 0; opacity: 0.9;">Сегодня ${dateStr}</p>
                <p style="margin: 5px 0 0 0; opacity: 0.8;">Ваша роль: ${roleBadge(user.role)}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 25px;">
    `;
    
    const quickActions = [];
    
    if (checkAccess('contracts', 'view')) {
        quickActions.push({ icon: '📋', title: 'Договоры', desc: 'Просмотр и управление договорами', section: 'contracts' });
    }
    if (checkAccess('contracts', 'create')) {
        quickActions.push({ icon: '➕', title: 'Новый договор', desc: 'Создать договор с папкой на Drive', section: 'contracts' });
    }
    if (checkAccess('documents', 'view')) {
        quickActions.push({ icon: '📁', title: 'Документация', desc: 'Рабочая документация', section: 'documents' });
    }
    if (checkAccess('finance', 'view')) {
        quickActions.push({ icon: '💰', title: 'Финансы', desc: 'Финансовые операции', section: 'finance' });
    }
    if (checkAccess('reports', 'view')) {
        quickActions.push({ icon: '📊', title: 'Отчёты', desc: 'Отчётность по проектам', section: 'reports' });
    }
    if (isAdmin) {
        quickActions.push({ icon: '👥', title: 'Пользователи', desc: 'Управление учётными записями', section: 'users' });
        quickActions.push({ icon: '📋', title: 'Журнал действий', desc: 'История всех операций', section: 'logs' });
        quickActions.push({ icon: '🔐', title: 'Матрица прав', desc: 'Настройка доступа по ролям', section: 'matrix' });
    }
    
    if (quickActions.length === 0) {
        html += `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; margin-bottom: 15px;">🏗️</div>
                <h3>Добро пожаловать в СтройРеестр!</h3>
                <p style="color: #666;">Разделы появятся после настройки прав администратором.</p>
            </div>
        `;
    } else {
        quickActions.forEach(action => {
            html += `
                <div class="quick-action-card" data-section="${escapeHtml(action.section)}" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; transition: all 0.2s; border: 2px solid transparent;">
                    <div style="font-size: 32px; margin-bottom: 10px;">${escapeHtml(action.icon)}</div>
                    <h3 style="margin: 0 0 5px 0; font-size: 16px;">${escapeHtml(action.title)}</h3>
                    <p style="margin: 0; color: #666; font-size: 13px;">${escapeHtml(action.desc)}</p>
                </div>
            `;
        });
    }
    
    html += `</div>`;
    
    html += `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">📌 О системе</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 14px;">
                <div>
                    <strong>Пользователь:</strong><br>
                    <span style="color: #666;">${escapeHtml(user.username)}</span>
                </div>
                <div>
                    <strong>Роль:</strong><br>
                    ${roleBadge(user.role)}
                </div>
                <div>
                    <strong>Версия:</strong><br>
                    <span style="color: #666;">СтройРеестр v2.0</span>
                </div>
                <div>
                    <strong>Последний вход:</strong><br>
                    <span style="color: #666;">${now.toLocaleString('ru-RU')}</span>
                </div>
            </div>
        </div>
    `;
    
    html += `</div>`;
    area.innerHTML = html;
    
    // Обработчики на быстрые действия
    area.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#007bff';
            card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'transparent';
            card.style.transform = 'translateY(0)';
        });
        card.addEventListener('click', () => navigateTo(card.dataset.section));
    });
}

function loadPlaceholder(icon, title, text) {
    document.getElementById('contentArea').innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
            <div style="font-size:64px;">${escapeHtml(icon)}</div>
            <h2 style="margin:20px 0;">${escapeHtml(title)}</h2>
            <p style="color:#666;">${escapeHtml(text)}</p>
        </div>
    `;
}

export function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

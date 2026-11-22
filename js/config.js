// URL вашего Apps Script
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3tH9Vf1ewKTyn0yYcBZ4SQ8f-IZlU115Hc_IRTDXuVji6CBvL3gSSxAmL1QjWVXFm/exec';

// Роли
export const ROLES = [
    'Администратор', 'ПТО', 'Бухгалтерия', 'Прораб', 'Архитектор',
    'Дизайнер', 'ГАП', 'ГИП', 'Тендерный_специалист', 'Отдел_кадров', 'Снабжение'
];

// Структура меню (разделы приложения)
export const MENU_ITEMS = [
    { id: 'contracts', title: 'Договоры', icon: '📋', section: 'contracts', action: 'view' },
    { id: 'documents', title: 'Документация', icon: '📁', section: 'documents', action: 'view' },
    { id: 'finance', title: 'Финансы', icon: '💰', section: 'finance', action: 'view' },
    { id: 'reports', title: 'Отчёты', icon: '📊', section: 'reports', action: 'view' },
    { id: 'users', title: 'Пользователи', icon: '👥', section: 'users', action: 'view', adminOnly: true },
    { id: 'matrix', title: 'Матрица прав', icon: '🔐', section: 'settings', action: 'edit', adminOnly: true },
    { id: 'logs', title: 'Журнал', icon: '📋', section: 'logs', action: 'view', adminOnly: true },
    { id: 'history', title: 'История', icon: '📜', section: 'logs', action: 'view', adminOnly: true },
    { id: 'trash', title: 'Корзина', icon: '🗑️', section: 'trash', action: 'view', adminOnly: true }
];

// Состояние приложения (глобальное)
export const state = {
    currentUser: null,
    matrixData: null,
    contractMeta: null,
    currentSection: 'contracts',
    currentEditUserId: null,
    selectedIcon: '🏢',
    contractSort: { field: 'createdAt', dir: 'desc' },
    contractFilter: {}
};

// Вспомогательные функции
export function roleBadge(role) {
    return `<span class="badge badge-${role}">${role}</span>`;
}

export function statusBadge(status) {
    return `<span class="status-badge status-${status}">${status}</span>`;
}

export function showMessage(elementId, msg, isError = true) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = msg.replace(/\n/g, '<br>');
    el.className = 'message ' + (isError ? 'error' : 'success-msg');
    el.classList.remove('hidden');
}

export function setBtnLoading(btnId, loading, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Обработка...' : text;
}

export function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

export function openModal(id) {
    document.getElementById(id).classList.add('active');
}

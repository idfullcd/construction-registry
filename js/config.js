export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5F8xSiQQgS1pm_6sqRFljHaMLmYy_4jo_KMkE5XaoS2X-fgus6nPNYat33s1oyQcl/exec';

export const ROLES = [
    'Администратор', 'ПТО', 'Бухгалтерия', 'Прораб', 'Архитектор',
    'Дизайнер', 'ГАП', 'ГИП', 'Тендерный_специалист', 'Отдел_кадров', 'Снабжение'
];

export const MENU_ITEMS = [
    { id: 'home', title: 'Главная', icon: '🏠', section: 'home', action: 'view', isHome: true },
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

export const state = {
    currentUser: null,
    sessionToken: null,
    matrixData: null,
    contractMeta: null,
    currentSection: null,
    currentEditUserId: null,
    selectedIcon: '🏢',
    contractSort: { field: 'createdAt', dir: 'desc' },
    contractFilter: {}
};

export function escapeHtml(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function roleBadge(role) {
    return `<span class="badge badge-${escapeHtml(role)}">${escapeHtml(role)}</span>`;
}

export function statusBadge(status) {
    return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

export function showMessage(elementId, msg, isError = true) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = msg;
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

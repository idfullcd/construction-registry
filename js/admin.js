import { sendRequest } from './api.js';
import { state, roleBadge } from './config.js';

// ============ МАТРИЦА ПРАВ ============
export async function loadMatrixTab() {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getMatrix', {});
    if (!result.success) {
        area.innerHTML = `<p style="color:red;">${result.error}</p>`;
        return;
    }
    
    state.matrixData = result;
    let html = `
        <h3>🔐 Матрица прав по ролям</h3>
        <p class="hint">Отметьте права для каждой роли. Изменения сохраняются кнопкой внизу.</p>
        <div class="scroll-table">
        <table class="matrix-table">
            <thead><tr><th>Роль</th>
    `;
    
    Object.keys(result.sections).forEach(sk => {
        html += `<th>${result.sections[sk]}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    result.roles.forEach(role => {
        html += `<tr><td>${roleBadge(role)}</td>`;
        const rolePerms = result.matrix[role] || {};
        Object.keys(result.sections).forEach(sk => {
            html += `<td><div style="display:flex; flex-direction:column; gap:2px; font-size:11px;">`;
            result.actions.forEach(action => {
                const checked = rolePerms[sk] && rolePerms[sk].includes(action) ? 'checked' : '';
                html += `<label style="display:flex; align-items:center; gap:3px; cursor:pointer;">
                    <input type="checkbox" data-role="${role}" data-section="${sk}" data-action="${action}" ${checked} style="width:auto;">
                    ${action}
                </label>`;
            });
            html += `</div></td>`;
        });
        html += `</tr>`;
    });
    
    html += `</tbody></table></div>
        <button class="btn btn-success" onclick="window.saveMatrix()" style="margin-top:15px;">💾 Сохранить матрицу</button>
    `;
    area.innerHTML = html;
}

window.saveMatrix = async () => {
    const checkboxes = document.querySelectorAll('.matrix-table input[type="checkbox"]');
    const rolesData = {};
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const r = cb.dataset.role;
            const s = cb.dataset.section;
            const a = cb.dataset.action;
            if (!rolesData[r]) rolesData[r] = {};
            if (!rolesData[r][s]) rolesData[r][s] = [];
            rolesData[r][s].push(a);
        }
    });
    
    let successCount = 0;
    for (const role of Object.keys(rolesData)) {
        const result = await sendRequest('updateMatrix', {
            role, permissions: rolesData[role],
            actorId: state.currentUser.id,
            actorUsername: state.currentUser.username,
            actorRole: state.currentUser.role
        });
        if (result.success) successCount++;
    }
    alert(`Сохранено ролей: ${successCount}`);
};

// ============ ЖУРНАЛ ДЕЙСТВИЙ ============
export async function loadLogsTab() {
    const area = document.getElementById('contentArea');
    area.innerHTML = `
        <h3>📋 Журнал действий</h3>
        <div class="filters">
            <input type="text" id="logFilterUser" placeholder="🔍 Пользователь">
            <select id="logFilterAction">
                <option value="">Все действия</option>
                <option value="login">Вход</option>
                <option value="register">Регистрация</option>
                <option value="create_contract">Создание договора</option>
                <option value="update_contract">Изменение договора</option>
                <option value="soft_delete_contract">Договор в корзину</option>
                <option value="restore_contract">Восстановление договора</option>
                <option value="change_role">Смена роли</option>
                <option value="change_permissions">Смена прав</option>
            </select>
            <input type="date" id="logFilterFrom">
            <input type="date" id="logFilterTo">
            <button class="btn btn-primary" onclick="window.applyLogsFilter()">Применить</button>
        </div>
        <div id="logsBody"><p>Загрузка...</p></div>
    `;
    await fetchLogs();
}

async function fetchLogs(filter = {}) {
    const result = await sendRequest('getLogs', { limit: 300, filter });
    const body = document.getElementById('logsBody');
    if (!result.success) { body.innerHTML = `<p style="color:red;">${result.error}</p>`; return; }
    
    if (result.logs.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:#999;">Записей не найдено</p>';
        return;
    }
    
    let html = `<div class="scroll-table"><table>
        <thead><tr><th>Время</th><th>Пользователь</th><th>Роль</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead><tbody>`;
    result.logs.forEach(log => {
        html += `<tr>
            <td style="font-size:11px; white-space:nowrap;">${new Date(log.timestamp).toLocaleString('ru-RU')}</td>
            <td><strong>${log.username}</strong></td>
            <td>${roleBadge(log.userRole)}</td>
            <td><code>${log.action}</code></td>
            <td>${log.target}</td>
            <td style="font-size:11px; max-width:200px; overflow:hidden; text-overflow:ellipsis;">${log.details}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    body.innerHTML = html;
}

window.applyLogsFilter = () => {
    fetchLogs({
        username: document.getElementById('logFilterUser').value.trim(),
        action: document.getElementById('logFilterAction').value,
        dateFrom: document.getElementById('logFilterFrom').value,
        dateTo: document.getElementById('logFilterTo').value
    });
};

// ============ ИСТОРИЯ ИЗМЕНЕНИЙ ============
export async function loadHistoryTab() {
    const area = document.getElementById('contentArea');
    area.innerHTML = `
        <h3>📜 История изменений</h3>
        <div class="filters">
            <input type="text" id="histFilterUser" placeholder="🔍 Пользователь">
            <select id="histFilterType">
                <option value="">Все типы</option>
                <option value="user">Пользователи</option>
                <option value="contract">Договоры</option>
                <option value="matrix">Матрица прав</option>
            </select>
            <input type="date" id="histFilterFrom">
            <input type="date" id="histFilterTo">
            <button class="btn btn-primary" onclick="window.applyHistFilter()">Применить</button>
        </div>
        <div id="histBody"><p>Загрузка...</p></div>
    `;
    await fetchHistory();
}

async function fetchHistory(filter = {}) {
    const result = await sendRequest('getHistory', { limit: 300, filter });
    const body = document.getElementById('histBody');
    if (!result.success) { body.innerHTML = `<p style="color:red;">${result.error}</p>`; return; }
    
    if (result.history.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:#999;">Записей не найдено</p>';
        return;
    }
    
    let html = `<div class="scroll-table"><table>
        <thead><tr><th>Время</th><th>Кто</th><th>Объект</th><th>Поле</th><th>Было</th><th>Стало</th></tr></thead><tbody>`;
    result.history.forEach(h => {
        html += `<tr>
            <td style="font-size:11px; white-space:nowrap;">${new Date(h.timestamp).toLocaleString('ru-RU')}</td>
            <td><strong>${h.username}</strong></td>
            <td>${h.entityType} <small style="color:#999;">(${String(h.entityId).substring(0,8)}...)</small></td>
            <td><code>${h.field}</code></td>
            <td style="font-size:11px; max-width:180px; overflow:hidden; background:#ffebee;">${h.oldValue || '—'}</td>
            <td style="font-size:11px; max-width:180px; overflow:hidden; background:#e8f5e9;">${h.newValue || '—'}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    body.innerHTML = html;
}

window.applyHistFilter = () => {
    fetchHistory({
        username: document.getElementById('histFilterUser').value.trim(),
        entityType: document.getElementById('histFilterType').value,
        dateFrom: document.getElementById('histFilterFrom').value,
        dateTo: document.getElementById('histFilterTo').value
    });
};

// ============ КОРЗИНА ПОЛЬЗОВАТЕЛЕЙ ============
export async function loadTrashTab() {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getTrash', {});
    if (!result.success) {
        area.innerHTML = `<p style="color:red;">${result.error}</p>`;
        return;
    }
    
    let html = `
        <div class="contracts-header">
            <h3>🗑️ Корзина пользователей (${result.trashed.length})</h3>
            ${result.trashed.length > 0 ? `<button class="btn btn-danger" onclick="window.emptyTrashConfirm()">🔥 Очистить корзину</button>` : ''}
        </div>
    `;
    
    if (result.trashed.length === 0) {
        html += '<p style="text-align:center; color:#999; padding:30px;">Корзина пуста</p>';
    } else {
        html += `<table>
            <thead><tr><th>Пользователь</th><th>Роль</th><th>Удалён</th><th>Действия</th></tr></thead><tbody>`;
        result.trashed.forEach(u => {
            html += `<tr>
                <td><strong>${u.username}</strong></td>
                <td>${roleBadge(u.role)}</td>
                <td style="font-size:11px;">${u.deletedAt ? new Date(u.deletedAt).toLocaleString('ru-RU') : '-'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-success" onclick="window.restoreUserConfirm('${u.id}', '${u.username}')">♻️ Восстановить</button>
                        <button class="btn btn-danger" onclick="window.hardDeleteConfirm('${u.id}', '${u.username}')">🔥 Навсегда</button>
                    </div>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
    }
    area.innerHTML = html;
}

window.restoreUserConfirm = async (userId, username) => {
    if (!confirm(`Восстановить "${username}"?`)) return;
    const result = await sendRequest('restoreUser', {
        targetUserId: userId,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert(result.message); loadTrashTab(); }
    else alert('Ошибка: ' + result.error);
};

window.hardDeleteConfirm = async (userId, username) => {
    if (!confirm(`⚠️ УДАЛИТЬ "${username}" НАВСЕГДА?`)) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('hardDeleteUser', {
        targetUserId: userId,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert(result.message); loadTrashTab(); }
    else alert('Ошибка: ' + result.error);
};

window.emptyTrashConfirm = async () => {
    if (!confirm('⚠️ Очистить корзину? ВСЕ пользователи будут удалены НАВСЕГДА!')) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('emptyTrash', {
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert(result.message); loadTrashTab(); }
    else alert('Ошибка: ' + result.error);
};

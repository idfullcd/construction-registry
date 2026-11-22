import { sendRequest } from './api.js';
import { state, roleBadge, escapeHtml } from './config.js';

export async function loadMatrixTab() {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getMatrix', {});
    if (!result.success) { area.innerHTML = `<p style="color:red;">${escapeHtml(result.error)}</p>`; return; }
    state.matrixData = result;
    let html = `
        <h3>🔐 Матрица прав по ролям</h3>
        <p class="hint">Отметьте права для каждой роли. Роль «Администратор» защищена от изменений.</p>
        <div class="scroll-table">
        <table class="matrix-table">
            <thead><tr><th>Роль</th>
    `;
    Object.keys(result.sections).forEach(sk => { html += `<th>${escapeHtml(result.sections[sk])}</th>`; });
    html += `</tr></thead><tbody id="matrixTbody"></tbody></table></div>
        <button class="btn btn-success" id="btnSaveMatrix" style="margin-top:15px;">💾 Сохранить матрицу</button>
    `;
    area.innerHTML = html;

    const tbody = document.getElementById('matrixTbody');
    result.roles.forEach(role => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${roleBadge(role)}</td>`;
        const rolePerms = result.matrix[role] || {};
        Object.keys(result.sections).forEach(sk => {
            const td = document.createElement('td');
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex; flex-direction:column; gap:2px; font-size:11px;';
            result.actions.forEach(action => {
                const checked = rolePerms[sk] && rolePerms[sk].includes(action);
                const label = document.createElement('label');
                label.style.cssText = 'display:flex; align-items:center; gap:3px; cursor:pointer;';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.style.width = 'auto'; cb.style.margin = '0';
                cb.dataset.role = role; cb.dataset.section = sk; cb.dataset.action = action;
                cb.checked = checked;
                if (role === 'Администратор') cb.disabled = true;
                label.appendChild(cb);
                label.appendChild(document.createTextNode(' ' + action));
                wrap.appendChild(label);
            });
            td.appendChild(wrap);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    document.getElementById('btnSaveMatrix').addEventListener('click', saveMatrix);
}

async function saveMatrix() {
    // Инициализируем ВСЕ роли, чтобы пустая тоже сохранилась
    const rolesData = {};
    state.matrixData.roles.forEach(r => { rolesData[r] = {}; });
    document.querySelectorAll('.matrix-table input[type="checkbox"]').forEach(cb => {
        if (!cb.checked) return;
        const r = cb.dataset.role, s = cb.dataset.section, a = cb.dataset.action;
        if (r === 'Администратор') return; // защита
        if (!rolesData[r][s]) rolesData[r][s] = [];
        rolesData[r][s].push(a);
    });
    let ok = 0, errors = [];
    for (const role of Object.keys(rolesData)) {
        const res = await sendRequest('updateMatrix', { role, permissions: rolesData[role] });
        if (res.success) ok++; else errors.push(role + ': ' + res.error);
    }
    alert(`Сохранено ролей: ${ok}` + (errors.length ? '\n' + errors.join('\n') : ''));
    loadMatrixTab();
}

export async function loadLogsTab() {
    const area = document.getElementById('contentArea');
    area.innerHTML = `
        <h3>📋 Журнал действий</h3>
        <div class="filters">
            <input type="text" id="logFilterUser" placeholder="🔍 Пользователь">
            <select id="logFilterAction">
                <option value="">Все действия</option>
                <option value="login">Вход</option><option value="register">Регистрация</option>
                <option value="create_contract">Создание договора</option>
                <option value="update_contract">Изменение договора</option>
                <option value="soft_delete_contract">Договор в корзину</option>
                <option value="restore_contract">Восстановление договора</option>
                <option value="change_role">Смена роли</option>
                <option value="change_permissions">Смена прав</option>
            </select>
            <input type="date" id="logFilterFrom">
            <input type="date" id="logFilterTo">
            <button class="btn btn-primary" id="btnApplyLogs">Применить</button>
        </div>
        <div id="logsBody"><p>Загрузка...</p></div>
    `;
    document.getElementById('btnApplyLogs').addEventListener('click', applyLogsFilter);
    await fetchLogs();
}

async function fetchLogs(filter = {}) {
    const result = await sendRequest('getLogs', { limit: 300, filter });
    const body = document.getElementById('logsBody');
    if (!result.success) { body.innerHTML = `<p style="color:red;">${escapeHtml(result.error)}</p>`; return; }
    if (result.logs.length === 0) { body.innerHTML = '<p style="text-align:center; color:#999;">Записей не найдено</p>'; return; }
    let html = `<div class="scroll-table"><table>
        <thead><tr><th>Время</th><th>Пользователь</th><th>Роль</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead><tbody>`;
    result.logs.forEach(log => {
        html += `<tr>
            <td style="font-size:11px; white-space:nowrap;">${escapeHtml(new Date(log.timestamp).toLocaleString('ru-RU'))}</td>
            <td><strong>${escapeHtml(log.username)}</strong></td>
            <td>${roleBadge(log.userRole)}</td>
            <td><code>${escapeHtml(log.action)}</code></td>
            <td>${escapeHtml(log.target)}</td>
            <td style="font-size:11px; max-width:200px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(log.details)}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    body.innerHTML = html;
}

function applyLogsFilter() {
    fetchLogs({
        username: document.getElementById('logFilterUser').value.trim(),
        action: document.getElementById('logFilterAction').value,
        dateFrom: document.getElementById('logFilterFrom').value,
        dateTo: document.getElementById('logFilterTo').value
    });
}

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
            <button class="btn btn-primary" id="btnApplyHist">Применить</button>
        </div>
        <div id="histBody"><p>Загрузка...</p></div>
    `;
    document.getElementById('btnApplyHist').addEventListener('click', applyHistFilter);
    await fetchHistory();
}

async function fetchHistory(filter = {}) {
    const result = await sendRequest('getHistory', { limit: 300, filter });
    const body = document.getElementById('histBody');
    if (!result.success) { body.innerHTML = `<p style="color:red;">${escapeHtml(result.error)}</p>`; return; }
    if (result.history.length === 0) { body.innerHTML = '<p style="text-align:center; color:#999;">Записей не найдено</p>'; return; }
    let html = `<div class="scroll-table"><table>
        <thead><tr><th>Время</th><th>Кто</th><th>Объект</th><th>Поле</th><th>Было</th><th>Стало</th></tr></thead><tbody>`;
    result.history.forEach(h => {
        html += `<tr>
            <td style="font-size:11px; white-space:nowrap;">${escapeHtml(new Date(h.timestamp).toLocaleString('ru-RU'))}</td>
            <td><strong>${escapeHtml(h.username)}</strong></td>
            <td>${escapeHtml(h.entityType)} <small style="color:#999;">(${escapeHtml(String(h.entityId).substring(0,8))}...)</small></td>
            <td><code>${escapeHtml(h.field)}</code></td>
            <td style="font-size:11px; max-width:180px; overflow:hidden; background:#ffebee;">${escapeHtml(h.oldValue) || '—'}</td>
            <td style="font-size:11px; max-width:180px; overflow:hidden; background:#e8f5e9;">${escapeHtml(h.newValue) || '—'}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    body.innerHTML = html;
}

function applyHistFilter() {
    fetchHistory({
        username: document.getElementById('histFilterUser').value.trim(),
        entityType: document.getElementById('histFilterType').value,
        dateFrom: document.getElementById('histFilterFrom').value,
        dateTo: document.getElementById('histFilterTo').value
    });
}

export async function loadTrashTab() {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getTrash', {});
    if (!result.success) { area.innerHTML = `<p style="color:red;">${escapeHtml(result.error)}</p>`; return; }
    let html = `
        <div class="contracts-header">
            <h3>🗑️ Корзина пользователей (${result.trashed.length})</h3>
            ${result.trashed.length > 0 ? '<button class="btn btn-danger" id="btnEmptyTrash">🔥 Очистить корзину</button>' : ''}
        </div>
    `;
    if (result.trashed.length === 0) {
        html += '<p style="text-align:center; color:#999; padding:30px;">Корзина пуста</p>';
    } else {
        html += `<table><thead><tr><th>Пользователь</th><th>Роль</th><th>Удалён</th><th>Действия</th></tr></thead><tbody id="trashTbody"></tbody></table>`;
    }
    area.innerHTML = html;
    document.getElementById('btnEmptyTrash')?.addEventListener('click', emptyTrashConfirm);

    if (result.trashed.length > 0) {
        const tbody = document.getElementById('trashTbody');
        result.trashed.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(u.username)}</strong></td>
                <td>${roleBadge(u.role)}</td>
                <td style="font-size:11px;">${u.deletedAt ? new Date(u.deletedAt).toLocaleString('ru-RU') : '-'}</td>
                <td><div class="actions-cell"></div></td>
            `;
            const cell = tr.querySelector('.actions-cell');
            const b1 = document.createElement('button');
            b1.className = 'btn btn-success'; b1.textContent = '♻️ Восстановить';
            b1.addEventListener('click', () => restoreUserConfirm(u.id, u.username));
            cell.appendChild(b1);
            const b2 = document.createElement('button');
            b2.className = 'btn btn-danger'; b2.textContent = '🔥 Навсегда';
            b2.addEventListener('click', () => hardDeleteConfirm(u.id, u.username));
            cell.appendChild(b2);
            tbody.appendChild(tr);
        });
    }
}

async function restoreUserConfirm(userId, username) {
    if (!confirm(`Восстановить "${username}"?`)) return;
    const result = await sendRequest('restoreUser', { targetUserId: userId });
    if (result.success) { alert(result.message); loadTrashTab(); }
    else alert('Ошибка: ' + result.error);
}

async function hardDeleteConfirm(userId, username) {
    if (!confirm(`⚠️ УДАЛИТЬ "${username}" НАВСЕГДА?`)) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('hardDeleteUser', { targetUserId: userId });
    if (result.success) { alert(result.message); loadTrashTab(); }
    else alert('Ошибка: ' + result.error);
}

async function emptyTrashConfirm() {
    if (!confirm('⚠️ Очистить корзину? ВСЕ пользователи будут удалены НАВСЕГДА!')) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('emptyTrash', {});
    if (result.success) { alert(result.message); loadTrashTab(); }
    else alert('Ошибка: ' + result.error);
}

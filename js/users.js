import { sendRequest } from './api.js';
import { state, roleBadge, closeModal, openModal } from './config.js';

export async function loadUsersTab() {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getUsers', {});
    if (!result.success) {
        area.innerHTML = `<p style="color:red;">${result.error}</p>`;
        return;
    }
    
    let html = `
        <div class="contracts-header">
            <h3>👥 Пользователи (${result.users.length})</h3>
        </div>
        <div class="scroll-table">
        <table>
            <thead>
                <tr>
                    <th>Пользователь</th>
                    <th>Роль</th>
                    <th>Создан</th>
                    <th>Последний вход</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    result.users.forEach(u => {
        const isSelf = u.username === state.currentUser.username;
        html += `
            <tr>
                <td><strong>${u.username}</strong> ${isSelf ? '<span style="color:#007bff;">(Вы)</span>' : ''}</td>
                <td>
                    ${isSelf ? roleBadge(u.role) : `
                        <select onchange="window.changeRole('${u.id}', this.value)" style="padding:4px; font-size:12px;">
                            ${result.roles.map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                        </select>
                    `}
                </td>
                <td style="font-size:11px;">${u.createdAt ? new Date(u.createdAt).toLocaleString('ru-RU') : '-'}</td>
                <td style="font-size:11px;">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('ru-RU') : '-'}</td>
                <td>
                    <div class="actions-cell">
                        ${!isSelf ? `
                            <button class="btn btn-primary" onclick="window.openPermissionsModal('${u.id}', '${u.username}')">⚙️ Права</button>
                            <button class="btn btn-danger" onclick="window.softDeleteUser('${u.id}', '${u.username}')">🗑️</button>
                        ` : '<em style="color:#999;">—</em>'}
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    area.innerHTML = html;
}

window.changeRole = async (userId, newRole) => {
    const result = await sendRequest('updateUserRole', {
        targetUserId: userId, newRole,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert('Роль изменена'); loadUsersTab(); }
    else alert('Ошибка: ' + result.error);
};

window.softDeleteUser = async (userId, username) => {
    if (!confirm(`Переместить "${username}" в корзину?`)) return;
    const result = await sendRequest('deleteUser', {
        targetUserId: userId,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert(result.message); loadUsersTab(); }
    else alert('Ошибка: ' + result.error);
};

window.openPermissionsModal = async (userId, username) => {
    state.currentEditUserId = userId;
    document.getElementById('permModalUsername').textContent = username;
    
    const [permResult, matrixResult] = await Promise.all([
        sendRequest('getUserPermissions', { targetUserId: userId }),
        sendRequest('getMatrix', {})
    ]);
    
    if (!permResult.success || !matrixResult.success) {
        alert('Ошибка загрузки данных');
        return;
    }
    
    state.matrixData = matrixResult;
    const customPerms = permResult.permissions;
    const rolePerms = matrixResult.matrix[permResult.role] || {};
    
    let html = `<p><strong>Роль:</strong> ${roleBadge(permResult.role)}</p><hr class="divider">`;
    
    Object.keys(matrixResult.sections).forEach(sectionKey => {
        const sectionName = matrixResult.sections[sectionKey];
        html += `<h4 style="margin:15px 0 5px 0;">${sectionName}</h4>`;
        html += `<div style="display:flex; gap:10px; flex-wrap:wrap;">`;
        matrixResult.actions.forEach(action => {
            const roleHas = rolePerms[sectionKey] && rolePerms[sectionKey].includes(action);
            const customHas = customPerms[sectionKey] && customPerms[sectionKey].includes(action);
            const checked = customHas ? 'checked' : '';
            const roleMark = roleHas ? '✓' : '—';
            html += `
                <label style="display:flex; align-items:center; gap:4px; font-size:13px; cursor:pointer;">
                    <input type="checkbox" data-section="${sectionKey}" data-action="${action}" ${checked} style="width:auto;">
                    ${action} <small style="color:#999;">(роль: ${roleMark})</small>
                </label>
            `;
        });
        html += `</div>`;
    });
    
    document.getElementById('permModalBody').innerHTML = html;
    openModal('permissionsModal');
};

window.saveCustomPermissions = async () => {
    const checkboxes = document.querySelectorAll('#permModalBody input[type="checkbox"]');
    const permissions = {};
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const s = cb.dataset.section;
            const a = cb.dataset.action;
            if (!permissions[s]) permissions[s] = [];
            permissions[s].push(a);
        }
    });
    
    const result = await sendRequest('updateUserPermissions', {
        targetUserId: state.currentEditUserId,
        permissions,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    
    if (result.success) {
        alert('Права сохранены');
        closeModal('permissionsModal');
        loadUsersTab();
    } else {
        alert('Ошибка: ' + result.error);
    }
};

window.resetCustomPermissions = async () => {
    if (!confirm('Сбросить индивидуальные права?')) return;
    const result = await sendRequest('updateUserPermissions', {
        targetUserId: state.currentEditUserId,
        permissions: {},
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) {
        alert('Права сброшены');
        closeModal('permissionsModal');
        loadUsersTab();
    }
};

import { sendRequest, checkAccess } from './api.js';
import { state, statusBadge, closeModal, openModal } from './config.js';

export async function loadContractsTab() {
    const area = document.getElementById('contentArea');
    const canCreate = checkAccess('contracts', 'create', state.currentUser, state.matrixData);
    const canRestore = checkAccess('contracts', 'restore', state.currentUser, state.matrixData);
    
    if (!state.contractMeta) {
        const metaRes = await sendRequest('getContractMeta', {});
        if (metaRes.success) state.contractMeta = metaRes;
    }
    
    let html = `
        <div class="contracts-header">
            <h3>📋 Договоры</h3>
            <div>
                ${canCreate ? '<button class="btn btn-primary" onclick="window.openContractModal()">➕ Новый договор</button>' : ''}
                ${canRestore ? '<button class="btn btn-secondary" onclick="window.loadContractTrashTab()">🗑️ Корзина</button>' : ''}
            </div>
        </div>
        
        <div class="filters">
            <input type="text" id="contractSearch" placeholder="🔍 Поиск..." onkeyup="if(event.key==='Enter') window.applyContractFilters()">
            <select id="contractFilterStatus" onchange="window.applyContractFilters()">
                <option value="">Все статусы</option>
                ${state.contractMeta.statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <select id="contractFilterObject" onchange="window.applyContractFilters()">
                <option value="">Все объекты</option>
                ${state.contractMeta.objects.map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>
            <select id="contractFilterIcon" onchange="window.applyContractFilters()">
                <option value="">Все иконки</option>
                ${state.contractMeta.icons.map(i => `<option value="${i}">${i}</option>`).join('')}
            </select>
            <button class="btn btn-secondary" onclick="window.resetContractFilters()">Сбросить</button>
        </div>
        
        <div id="contractsBody"></div>
    `;
    area.innerHTML = html;
    await fetchContracts();
}

async function fetchContracts() {
    const body = document.getElementById('contractsBody');
    body.innerHTML = '<p>Загрузка...</p>';
    
    const result = await sendRequest('getContracts', {
        filter: state.contractFilter,
        sort: state.contractSort,
        actorRole: state.currentUser.role,
        actorPermissions: state.currentUser.customPermissions
    });
    
    if (!result.success) {
        body.innerHTML = `<p style="color:red;">${result.error}</p>`;
        return;
    }
    
    if (result.contracts.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:#999; padding:30px;">Договоров не найдено</p>';
        return;
    }
    
    const canEdit = checkAccess('contracts', 'edit', state.currentUser, state.matrixData);
    const canDelete = checkAccess('contracts', 'delete', state.currentUser, state.matrixData);
    
    const sortInd = (f) => state.contractSort.field === f 
        ? `<span class="sort-indicator">${state.contractSort.dir === 'asc' ? '▲' : '▼'}</span>` 
        : '';
    
    let html = `<div class="scroll-table"><table>
        <thead>
            <tr>
                <th class="sortable" onclick="window.sortContracts('number')">ID ${sortInd('number')}</th>
                <th class="sortable" onclick="window.sortContracts('icon')">🎯 ${sortInd('icon')}</th>
                <th class="sortable" onclick="window.sortContracts('title')">Название ${sortInd('title')}</th>
                <th class="sortable" onclick="window.sortContracts('contractor')">Контрагент ${sortInd('contractor')}</th>
                <th class="sortable" onclick="window.sortContracts('sum')">Сумма ${sortInd('sum')}</th>
                <th class="sortable" onclick="window.sortContracts('objectType')">Объект ${sortInd('objectType')}</th>
                <th class="sortable" onclick="window.sortContracts('status')">Статус ${sortInd('status')}</th>
                <th class="sortable" onclick="window.sortContracts('contractDate')">Дата ${sortInd('contractDate')}</th>
                <th>Папка</th>
                <th>Действия</th>
            </tr>
        </thead>
        <tbody>`;
    
    result.contracts.forEach(c => {
        const sum = c.sum ? Number(c.sum).toLocaleString('ru-RU', {minimumFractionDigits: 2}) + ' ₽' : '—';
        html += `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td style="font-size:20px; text-align:center;">${c.icon}</td>
                <td><strong>${c.title}</strong></td>
                <td>${c.contractor}</td>
                <td style="text-align:right; white-space:nowrap;">${sum}</td>
                <td>${c.objectType}</td>
                <td>${statusBadge(c.status)}</td>
                <td style="font-size:11px;">${c.contractDate ? new Date(c.contractDate).toLocaleDateString('ru-RU') : '—'}</td>
                <td>
                    ${c.driveFolderUrl ? `<a href="${c.driveFolderUrl}" target="_blank" class="drive-link">📁 Открыть</a>` : '—'}
                </td>
                <td>
                    <div class="actions-cell">
                        ${canEdit ? `<button class="btn btn-primary" onclick="window.openContractModal('${c.id}')" title="Редактировать">✏️</button>` : ''}
                        ${canDelete ? `<button class="btn btn-danger" onclick="window.deleteContractConfirm('${c.id}', '${c.title.replace(/'/g, "\\'")}')" title="В корзину">🗑️</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    html += `<p style="font-size:12px; color:#666; margin-top:8px;">Всего: ${result.contracts.length}</p>`;
    body.innerHTML = html;
}

window.sortContracts = (field) => {
    if (state.contractSort.field === field) {
        state.contractSort.dir = state.contractSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        state.contractSort.field = field;
        state.contractSort.dir = 'asc';
    }
    fetchContracts();
};

window.applyContractFilters = () => {
    state.contractFilter = {
        search: document.getElementById('contractSearch').value.trim(),
        status: document.getElementById('contractFilterStatus').value,
        objectType: document.getElementById('contractFilterObject').value,
        icon: document.getElementById('contractFilterIcon').value
    };
    fetchContracts();
};

window.resetContractFilters = () => {
    state.contractFilter = {};
    document.getElementById('contractSearch').value = '';
    document.getElementById('contractFilterStatus').value = '';
    document.getElementById('contractFilterObject').value = '';
    document.getElementById('contractFilterIcon').value = '';
    fetchContracts();
};

window.openContractModal = async (contractId = null) => {
    if (!state.contractMeta) {
        const metaRes = await sendRequest('getContractMeta', {});
        if (metaRes.success) state.contractMeta = metaRes;
    }
    
    document.getElementById('contractModalTitle').textContent = contractId ? 'Редактирование договора' : 'Новый договор';
    
    let formHTML = `
        <input type="hidden" id="contractEditId" value="${contractId || ''}">
        
        <div class="form-group">
            <label>Название договора *</label>
            <input type="text" id="contractTitle" placeholder="Напр., Договор подряда">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Контрагент *</label>
                <input type="text" id="contractContractor" placeholder="ООО «Пример»">
            </div>
            <div class="form-group">
                <label>Сумма, ₽</label>
                <input type="number" id="contractSum" placeholder="0" step="0.01">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Дата заключения</label>
                <input type="date" id="contractDate">
            </div>
            <div class="form-group">
                <label>Дата окончания</label>
                <input type="date" id="contractEndDate">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Тип объекта</label>
                <select id="contractObject">
                    ${state.contractMeta.objects.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Статус</label>
                <select id="contractStatus">
                    ${state.contractMeta.statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label>Иконка договора</label>
            <div class="icon-picker" id="contractIconPicker">
                ${state.contractMeta.icons.map(icon => 
                    `<button type="button" class="icon-option ${icon === state.selectedIcon ? 'selected' : ''}" onclick="window.selectIcon('${icon}', this)">${icon}</button>`
                ).join('')}
            </div>
        </div>
        
        <div class="form-group">
            <label>Описание</label>
            <textarea id="contractDescription" rows="3" placeholder="Краткое описание..."></textarea>
        </div>
        
        <div id="contractDriveInfo" class="hidden"></div>
        
        <div class="modal-actions">
            <button class="btn btn-success" onclick="window.saveContract()">💾 Сохранить</button>
            <button class="btn btn-secondary" onclick="closeModal('contractModal')">Отмена</button>
        </div>
    `;
    
    document.getElementById('contractForm').innerHTML = formHTML;
    
    if (contractId) {
        const result = await sendRequest('getContracts', {
            filter: {}, sort: { field: 'createdAt', dir: 'desc' },
            actorRole: state.currentUser.role,
            actorPermissions: state.currentUser.customPermissions
        });
        if (result.success) {
            const c = result.contracts.find(x => x.id === contractId);
            if (c) {
                document.getElementById('contractTitle').value = c.title;
                document.getElementById('contractContractor').value = c.contractor;
                document.getElementById('contractSum').value = c.sum || '';
                document.getElementById('contractDate').value = c.contractDate ? c.contractDate.split('T')[0] : '';
                document.getElementById('contractEndDate').value = c.endDate ? c.endDate.split('T')[0] : '';
                document.getElementById('contractObject').value = c.objectType;
                document.getElementById('contractStatus').value = c.status;
                document.getElementById('contractDescription').value = c.description || '';
                window.selectIcon(c.icon);
                
                if (c.driveFolderUrl) {
                    const info = document.getElementById('contractDriveInfo');
                    info.innerHTML = `
                        <div style="background:#fff3cd; padding:10px; border-radius:4px; margin:10px 0;">
                            <strong>📁 Папка на Google Drive:</strong><br>
                            <a href="${c.driveFolderUrl}" target="_blank" class="drive-link" style="margin-top:5px;">🔗 Открыть папку</a>
                        </div>
                    `;
                    info.classList.remove('hidden');
                }
            }
        }
    } else {
        window.selectIcon('🏢');
    }
    
    openModal('contractModal');
};

window.selectIcon = (icon, btnEl = null) => {
    state.selectedIcon = icon;
    document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
    if (btnEl) btnEl.classList.add('selected');
    else {
        document.querySelectorAll('.icon-option').forEach(b => {
            if (b.textContent.trim() === icon) b.classList.add('selected');
        });
    }
};

window.saveContract = async () => {
    const contractId = document.getElementById('contractEditId').value;
    const data = {
        title: document.getElementById('contractTitle').value.trim(),
        contractor: document.getElementById('contractContractor').value.trim(),
        sum: parseFloat(document.getElementById('contractSum').value) || 0,
        contractDate: document.getElementById('contractDate').value,
        endDate: document.getElementById('contractEndDate').value,
        objectType: document.getElementById('contractObject').value,
        status: document.getElementById('contractStatus').value,
        description: document.getElementById('contractDescription').value.trim(),
        icon: state.selectedIcon,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role,
        actorPermissions: state.currentUser.customPermissions
    };
    
    if (!data.title || !data.contractor) {
        alert('Название и контрагент обязательны');
        return;
    }
    
    const result = contractId
        ? await sendRequest('updateContract', { contractId, updates: data })
        : await sendRequest('createContract', data);
    
    if (result.success) {
        alert(result.message);
        closeModal('contractModal');
        fetchContracts();
    } else {
        alert('Ошибка: ' + result.error);
    }
};

window.deleteContractConfirm = async (id, title) => {
    if (!confirm(`Переместить договор "${title}" в корзину?`)) return;
    const result = await sendRequest('deleteContract', {
        contractId: id,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role,
        actorPermissions: state.currentUser.customPermissions
    });
    if (result.success) { alert(result.message); fetchContracts(); }
    else alert('Ошибка: ' + result.error);
};

window.loadContractTrashTab = async () => {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getContractTrash', {
        actorRole: state.currentUser.role,
        actorPermissions: state.currentUser.customPermissions
    });
    
    if (!result.success) {
        area.innerHTML = `<p style="color:red;">${result.error}</p>`;
        return;
    }
    
    const canRestore = checkAccess('contracts', 'restore', state.currentUser, state.matrixData);
    const isAdmin = state.currentUser.role === 'Администратор';
    
    let html = `
        <div class="contracts-header">
            <h3>🗑️ Корзина договоров (${result.trashed.length})</h3>
            <div>
                <button class="btn btn-secondary" onclick="window.navigateTo('contracts')">← Назад</button>
                ${isAdmin && result.trashed.length > 0 ? `<button class="btn btn-danger" onclick="window.emptyContractTrashConfirm()">🔥 Очистить</button>` : ''}
            </div>
        </div>
    `;
    
    if (result.trashed.length === 0) {
        html += '<p style="text-align:center; color:#999; padding:30px;">Корзина пуста</p>';
    } else {
        html += `<table>
            <thead><tr><th>ID</th><th>Иконка</th><th>Название</th><th>Контрагент</th><th>Удалён</th><th>Действия</th></tr></thead><tbody>`;
        result.trashed.forEach(c => {
            html += `<tr>
                <td><strong>${c.id}</strong></td>
                <td style="font-size:20px;">${c.icon}</td>
                <td>${c.title}</td>
                <td>${c.contractor}</td>
                <td style="font-size:11px;">${c.deletedAt ? new Date(c.deletedAt).toLocaleString('ru-RU') : '—'}</td>
                <td>
                    <div class="actions-cell">
                        ${canRestore ? `<button class="btn btn-success" onclick="window.restoreContractConfirm('${c.id}', '${c.title.replace(/'/g, "\\'")}')">♻️</button>` : ''}
                        ${isAdmin ? `<button class="btn btn-danger" onclick="window.hardDeleteContractConfirm('${c.id}', '${c.title.replace(/'/g, "\\'")}')">🔥</button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
    }
    area.innerHTML = html;
};

window.restoreContractConfirm = async (id, title) => {
    if (!confirm(`Восстановить договор "${title}"?`)) return;
    const result = await sendRequest('restoreContract', {
        contractId: id,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role,
        actorPermissions: state.currentUser.customPermissions
    });
    if (result.success) { alert(result.message); window.loadContractTrashTab(); }
    else alert('Ошибка: ' + result.error);
};

window.hardDeleteContractConfirm = async (id, title) => {
    if (!confirm(`⚠️ УДАЛИТЬ договор "${title}" НАВСЕГДА?`)) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('hardDeleteContract', {
        contractId: id,
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert(result.message); window.loadContractTrashTab(); }
    else alert('Ошибка: ' + result.error);
};

window.emptyContractTrashConfirm = async () => {
    if (!confirm('⚠️ Очистить корзину договоров? ВСЕ договоры будут удалены НАВСЕГДА!')) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('emptyContractTrash', {
        actorId: state.currentUser.id,
        actorUsername: state.currentUser.username,
        actorRole: state.currentUser.role
    });
    if (result.success) { alert(result.message); window.loadContractTrashTab(); }
    else alert('Ошибка: ' + result.error);
};

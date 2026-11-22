import { sendRequest, checkAccess } from './api.js';
import { state, statusBadge, closeModal, openModal, escapeHtml } from './config.js';

export async function loadContractsTab() {
    const area = document.getElementById('contentArea');
    if (!state.contractMeta || !state.contractMeta.statuses) {
        area.innerHTML = '<p style="color:red;">Не удалось загрузить справочники. Обновите страницу.</p>';
        return;
    }
    const canCreate = checkAccess('contracts', 'create');
    const canRestore = checkAccess('contracts', 'restore');

    let html = `
        <div class="contracts-header">
            <h3>📋 Договоры</h3>
            <div>
                ${canCreate ? '<button class="btn btn-primary" id="btnNewContract">➕ Новый договор</button>' : ''}
                ${canRestore ? '<button class="btn btn-secondary" id="btnContractTrash">🗑️ Корзина</button>' : ''}
            </div>
        </div>
        <div class="filters">
            <input type="text" id="contractSearch" placeholder="🔍 Поиск...">
            <select id="contractFilterStatus">
                <option value="">Все статусы</option>
                ${state.contractMeta.statuses.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
            </select>
            <select id="contractFilterObject">
                <option value="">Все объекты</option>
                ${state.contractMeta.objects.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
            </select>
            <select id="contractFilterIcon">
                <option value="">Все иконки</option>
                ${state.contractMeta.icons.map(i => `<option value="${escapeHtml(i)}">${escapeHtml(i)}</option>`).join('')}
            </select>
            <button class="btn btn-primary" id="btnApplyFilter">Применить</button>
            <button class="btn btn-secondary" id="btnResetFilter">Сбросить</button>
        </div>
        <div id="contractsBody"></div>
    `;
    area.innerHTML = html;

    document.getElementById('btnApplyFilter')?.addEventListener('click', applyContractFilters);
    document.getElementById('btnResetFilter')?.addEventListener('click', resetContractFilters);
    document.getElementById('contractSearch')?.addEventListener('keyup', e => { if (e.key === 'Enter') applyContractFilters(); });
    document.getElementById('contractFilterStatus')?.addEventListener('change', applyContractFilters);
    document.getElementById('contractFilterObject')?.addEventListener('change', applyContractFilters);
    document.getElementById('contractFilterIcon')?.addEventListener('change', applyContractFilters);
    document.getElementById('btnNewContract')?.addEventListener('click', () => openContractModal());
    document.getElementById('btnContractTrash')?.addEventListener('click', loadContractTrashTab);

    await fetchContracts();
}

async function fetchContracts() {
    const body = document.getElementById('contractsBody');
    body.innerHTML = '<p>Загрузка...</p>';
    const result = await sendRequest('getContracts', {
        filter: state.contractFilter, sort: state.contractSort
    });
    if (!result.success) { body.innerHTML = `<p style="color:red;">${escapeHtml(result.error)}</p>`; return; }
    if (result.contracts.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:#999; padding:30px;">Договоров не найдено</p>';
        return;
    }
    const canEdit = checkAccess('contracts', 'edit');
    const canDelete = checkAccess('contracts', 'delete');
    const sortInd = (f) => state.contractSort.field === f
        ? `<span class="sort-indicator">${state.contractSort.dir === 'asc' ? '▲' : '▼'}</span>`
        : '';
    let html = `<div class="scroll-table"><table>
        <thead><tr>
            <th class="sortable" data-sort="number">ID ${sortInd('number')}</th>
            <th class="sortable" data-sort="icon">🎯 ${sortInd('icon')}</th>
            <th class="sortable" data-sort="title">Название ${sortInd('title')}</th>
            <th class="sortable" data-sort="contractor">Контрагент ${sortInd('contractor')}</th>
            <th class="sortable" data-sort="sum">Сумма ${sortInd('sum')}</th>
            <th class="sortable" data-sort="objectType">Объект ${sortInd('objectType')}</th>
            <th class="sortable" data-sort="status">Статус ${sortInd('status')}</th>
            <th class="sortable" data-sort="contractDate">Дата ${sortInd('contractDate')}</th>
            <th>Папка</th><th>Действия</th>
        </tr></thead><tbody id="contractsTbody"></tbody></table></div>`;
    html += `<p style="font-size:12px; color:#666; margin-top:8px;">Всего: ${result.contracts.length}</p>`;
    body.innerHTML = html;

    const tbody = document.getElementById('contractsTbody');
    result.contracts.forEach(c => {
        const sum = c.sum ? Number(c.sum).toLocaleString('ru-RU', { minimumFractionDigits: 2 }) + ' ₽' : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(c.id)}</strong></td>
            <td style="font-size:20px; text-align:center;">${escapeHtml(c.icon)}</td>
            <td><strong>${escapeHtml(c.title)}</strong></td>
            <td>${escapeHtml(c.contractor)}</td>
            <td style="text-align:right; white-space:nowrap;">${escapeHtml(sum)}</td>
            <td>${escapeHtml(c.objectType)}</td>
            <td>${statusBadge(c.status)}</td>
            <td style="font-size:11px;">${c.contractDate ? escapeHtml(new Date(c.contractDate).toLocaleDateString('ru-RU')) : '—'}</td>
            <td>${c.driveFolderUrl ? `<a href="${escapeHtml(c.driveFolderUrl)}" target="_blank" class="drive-link">📁 Открыть</a>` : '—'}</td>
            <td><div class="actions-cell"></div></td>
        `;
        const actionsCell = tr.querySelector('.actions-cell');
        if (canEdit) {
            const b = document.createElement('button');
            b.className = 'btn btn-primary'; b.textContent = '✏️'; b.title = 'Редактировать';
            b.addEventListener('click', () => openContractModal(c.id));
            actionsCell.appendChild(b);
        }
        if (canDelete) {
            const b = document.createElement('button');
            b.className = 'btn btn-danger'; b.textContent = '🗑️'; b.title = 'В корзину';
            b.addEventListener('click', () => deleteContractConfirm(c.id, c.title));
            actionsCell.appendChild(b);
        }
        tbody.appendChild(tr);
    });

    // Сортировка
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const f = th.dataset.sort;
            if (state.contractSort.field === f) {
                state.contractSort.dir = state.contractSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                state.contractSort.field = f;
                state.contractSort.dir = 'asc';
            }
            fetchContracts();
        });
    });
}

function applyContractFilters() {
    state.contractFilter = {
        search: document.getElementById('contractSearch').value.trim(),
        status: document.getElementById('contractFilterStatus').value,
        objectType: document.getElementById('contractFilterObject').value,
        icon: document.getElementById('contractFilterIcon').value
    };
    fetchContracts();
}

function resetContractFilters() {
    state.contractFilter = {};
    document.getElementById('contractSearch').value = '';
    document.getElementById('contractFilterStatus').value = '';
    document.getElementById('contractFilterObject').value = '';
    document.getElementById('contractFilterIcon').value = '';
    fetchContracts();
}

async function openContractModal(contractId = null) {
    if (!state.contractMeta) {
        const metaRes = await sendRequest('getContractMeta', {});
        if (metaRes.success) state.contractMeta = metaRes;
    }
    document.getElementById('contractModalTitle').textContent = contractId ? 'Редактирование договора' : 'Новый договор';
    state.selectedIcon = '🏢';
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
                    ${state.contractMeta.objects.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Статус</label>
                <select id="contractStatus">
                    ${state.contractMeta.statuses.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Иконка договора</label>
            <div class="icon-picker" id="contractIconPicker">
                ${state.contractMeta.icons.map(icon =>
                    `<button type="button" class="icon-option ${icon === state.selectedIcon ? 'selected' : ''}" data-icon="${escapeHtml(icon)}">${escapeHtml(icon)}</button>`
                ).join('')}
            </div>
        </div>
        <div class="form-group">
            <label>Описание</label>
            <textarea id="contractDescription" rows="3" placeholder="Краткое описание..."></textarea>
        </div>
        <div id="contractDriveInfo" class="hidden"></div>
        <div class="modal-actions">
            <button class="btn btn-success" id="btnSaveContract">💾 Сохранить</button>
            <button class="btn btn-secondary" onclick="window._closeModal('contractModal')">Отмена</button>
        </div>
    `;
    document.getElementById('contractForm').innerHTML = formHTML;

    document.querySelectorAll('#contractIconPicker .icon-option').forEach(b => {
        b.addEventListener('click', () => {
            state.selectedIcon = b.dataset.icon;
            document.querySelectorAll('#contractIconPicker .icon-option').forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
        });
    });
    document.getElementById('btnSaveContract').addEventListener('click', saveContract);

    if (contractId) {
        const result = await sendRequest('getContracts', { filter: {}, sort: { field: 'createdAt', dir: 'desc' } });
        if (result.success) {
            const c = result.contracts.find(x => x.id === contractId);
            if (c) {
                document.getElementById('contractTitle').value = c.title;
                document.getElementById('contractContractor').value = c.contractor;
                document.getElementById('contractSum').value = c.sum || '';
                document.getElementById('contractDate').value = c.contractDate || '';
                document.getElementById('contractEndDate').value = c.endDate || '';
                document.getElementById('contractObject').value = c.objectType;
                document.getElementById('contractStatus').value = c.status;
                document.getElementById('contractDescription').value = c.description || '';
                state.selectedIcon = c.icon;
                document.querySelectorAll('#contractIconPicker .icon-option').forEach(b => {
                    b.classList.toggle('selected', b.dataset.icon === c.icon);
                });
                if (c.driveFolderUrl) {
                    const info = document.getElementById('contractDriveInfo');
                    info.innerHTML = `
                        <div style="background:#fff3cd; padding:10px; border-radius:4px; margin:10px 0;">
                            <strong>📁 Папка на Google Drive:</strong><br>
                            <a href="${escapeHtml(c.driveFolderUrl)}" target="_blank" class="drive-link" style="margin-top:5px;">🔗 Открыть папку</a>
                        </div>
                    `;
                    info.classList.remove('hidden');
                }
            }
        }
    }
    openModal('contractModal');
}

async function saveContract() {
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
        icon: state.selectedIcon
    };
    if (!data.title || !data.contractor) { alert('Название и контрагент обязательны'); return; }
    const result = contractId
        ? await sendRequest('updateContract', { contractId, updates: data })
        : await sendRequest('createContract', data);
    if (result.success) { alert(result.message); closeModal('contractModal'); fetchContracts(); }
    else alert('Ошибка: ' + result.error);
}

async function deleteContractConfirm(id, title) {
    if (!confirm(`Переместить договор "${title}" в корзину?`)) return;
    const result = await sendRequest('deleteContract', { contractId: id });
    if (result.success) { alert(result.message); fetchContracts(); }
    else alert('Ошибка: ' + result.error);
}

async function loadContractTrashTab() {
    const area = document.getElementById('contentArea');
    const result = await sendRequest('getContractTrash', {});
    if (!result.success) { area.innerHTML = `<p style="color:red;">${escapeHtml(result.error)}</p>`; return; }
    const canRestore = checkAccess('contracts', 'restore');
    const isAdmin = state.currentUser.role === 'Администратор';
    let html = `
        <div class="contracts-header">
            <h3>🗑️ Корзина договоров (${result.trashed.length})</h3>
            <div>
                <button class="btn btn-secondary" id="btnBackContracts">← Назад</button>
                ${isAdmin && result.trashed.length > 0 ? '<button class="btn btn-danger" id="btnEmptyContractTrash">🔥 Очистить</button>' : ''}
            </div>
        </div>
    `;
    if (result.trashed.length === 0) {
        html += '<p style="text-align:center; color:#999; padding:30px;">Корзина пуста</p>';
    } else {
        html += `<table><thead><tr><th>ID</th><th>Иконка</th><th>Название</th><th>Контрагент</th><th>Удалён</th><th>Действия</th></tr></thead><tbody id="contractTrashTbody"></tbody></table>`;
    }
    area.innerHTML = html;
    document.getElementById('btnBackContracts')?.addEventListener('click', () => loadContractsTab());
    document.getElementById('btnEmptyContractTrash')?.addEventListener('click', emptyContractTrashConfirm);

    if (result.trashed.length > 0) {
        const tbody = document.getElementById('contractTrashTbody');
        result.trashed.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(c.id)}</strong></td>
                <td style="font-size:20px;">${escapeHtml(c.icon)}</td>
                <td>${escapeHtml(c.title)}</td>
                <td>${escapeHtml(c.contractor)}</td>
                <td style="font-size:11px;">${c.deletedAt ? new Date(c.deletedAt).toLocaleString('ru-RU') : '—'}</td>
                <td><div class="actions-cell"></div></td>
            `;
            const cell = tr.querySelector('.actions-cell');
            if (canRestore) {
                const b = document.createElement('button');
                b.className = 'btn btn-success'; b.textContent = '♻️';
                b.addEventListener('click', () => restoreContractConfirm(c.id, c.title));
                cell.appendChild(b);
            }
            if (isAdmin) {
                const b = document.createElement('button');
                b.className = 'btn btn-danger'; b.textContent = '🔥';
                b.addEventListener('click', () => hardDeleteContractConfirm(c.id, c.title));
                cell.appendChild(b);
            }
            tbody.appendChild(tr);
        });
    }
}

async function restoreContractConfirm(id, title) {
    if (!confirm(`Восстановить договор "${title}"?`)) return;
    const result = await sendRequest('restoreContract', { contractId: id });
    if (result.success) { alert(result.message); loadContractTrashTab(); }
    else alert('Ошибка: ' + result.error);
}

async function hardDeleteContractConfirm(id, title) {
    if (!confirm(`⚠️ УДАЛИТЬ договор "${title}" НАВСЕГДА?`)) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('hardDeleteContract', { contractId: id });
    if (result.success) { alert(result.message); loadContractTrashTab(); }
    else alert('Ошибка: ' + result.error);
}

async function emptyContractTrashConfirm() {
    if (!confirm('⚠️ Очистить корзину договоров? ВСЕ договоры будут удалены НАВСЕГДА!')) return;
    if (!confirm('Это действие НЕОБРАТИМО. Продолжить?')) return;
    const result = await sendRequest('emptyContractTrash', {});
    if (result.success) { alert(result.message); loadContractTrashTab(); }
    else alert('Ошибка: ' + result.error);
}

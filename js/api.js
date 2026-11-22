import { SCRIPT_URL } from './config.js';

export async function sendRequest(action, data = {}) {
    try {
        const payload = JSON.stringify({ action, ...data });
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow',
            cache: 'no-cache'
        });
        const text = await response.text();
        try { return JSON.parse(text); }
        catch (e) { return { success: false, error: 'Некорректный ответ сервера' }; }
    } catch (error) {
        console.error('[API]', error);
        return { success: false, error: 'Ошибка сети. Проверьте подключение.' };
    }
}

// Проверка прав доступа
export function checkAccess(section, action, currentUser, matrixData) {
    if (!currentUser || !matrixData) return false;
    const cp = currentUser.customPermissions;
    if (cp && cp[section] && cp[section].includes(action)) return true;
    const rolePerms = matrixData.matrix[currentUser.role] || {};
    return rolePerms[section] && rolePerms[section].includes(action);
}

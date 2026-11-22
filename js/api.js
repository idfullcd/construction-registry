import { SCRIPT_URL, state } from './config.js';

export async function sendRequest(action, data = {}) {
    try {
        const payload = JSON.stringify({
            action,
            sessionToken: state.sessionToken,
            ...data
        });
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow',
            cache: 'no-cache'
        });
        const text = await response.text();
        let result;
        try { result = JSON.parse(text); }
        catch (e) { return { success: false, error: 'Некорректный ответ сервера' }; }

        // Если сессия истекла/невалидна — выбрасываем на логин
        if (!result.success && (result.code === 'EXPIRED' || result.code === 'BAD_TOKEN' || result.code === 'NO_TOKEN' || result.code === 'USER_GONE')) {
            state.sessionToken = null;
            state.currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionToken');
            document.getElementById('appScreen').classList.add('hidden');
            document.getElementById('authScreen').classList.remove('hidden');
            alert('Сессия истекла. Войдите снова.');
        }
        return result;
    } catch (error) {
        console.error('[API]', error);
        return { success: false, error: 'Ошибка сети. Проверьте подключение.' };
    }
}

export function checkAccess(section, action) {
    if (!state.currentUser || !state.matrixData) return false;
    const cp = state.currentUser.customPermissions;
    if (cp && cp[section] && cp[section].includes(action)) return true;
    if (state.currentUser.role === 'Администратор') return true;
    const rolePerms = state.matrixData.matrix[state.currentUser.role] || {};
    return rolePerms[section] && rolePerms[section].includes(action);
}

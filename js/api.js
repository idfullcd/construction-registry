import { SCRIPT_URL, state } from './config.js';

export async function sendRequest(action, data = {}) {
    try {
        const payload = JSON.stringify({
            action,
            sessionToken: state.sessionToken,
            ...data
        });

        console.log('[API] Request:', action, '| Token:', state.sessionToken ? 'present' : 'missing');

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow',
            cache: 'no-cache'
        });

        const text = await response.text();

        let result;
        try {
            result = JSON.parse(text);
            console.log(
                '[API] Response:',
                action,
                '| Success:',
                result.success,
                result.error ? '| Error: ' + result.error : ''
            );
        } catch (e) {
            console.error('[API] Parse error:', text.substring(0, 300));
            return {
                success: false,
                error: 'Некорректный ответ сервера. Проверьте развертывание Apps Script.'
            };
        }

        if (
            !result.success &&
            result.code &&
            ['EXPIRED', 'BAD_TOKEN', 'NO_TOKEN', 'USER_GONE'].includes(result.code)
        ) {
            console.warn('[API] Session invalid:', result.code);

            state.sessionToken = null;
            state.currentUser = null;
            state.matrixData = null;
            state.contractMeta = null;

            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionToken');

            const authScreen = document.getElementById('authScreen');
            const appScreen = document.getElementById('appScreen');

            if (authScreen && appScreen) {
                appScreen.classList.add('hidden');
                authScreen.classList.remove('hidden');
            }

            if (!sessionStorage.getItem('sessionExpiredShown')) {
                sessionStorage.setItem('sessionExpiredShown', '1');
                setTimeout(() => {
                    alert('Сессия истекла или невалидна. Войдите снова.');
                }, 100);
            }

            return result;
        }

        return result;
    } catch (error) {
        console.error('[API] Network error:', error);
        return {
            success: false,
            error: 'Ошибка сети. Проверьте подключение и URL Apps Script.'
        };
    }
}

export function checkAccess(section, action) {
    if (!state.currentUser) {
        console.warn('[checkAccess] No current user');
        return false;
    }

    if (section === 'home') return true;

    if (state.currentUser.role === 'Администратор') return true;

    const cp = state.currentUser.customPermissions;
    if (cp && cp[section] && cp[section].includes(action)) return true;

    if (!state.matrixData) {
        console.warn('[checkAccess] No matrix data loaded');
        return false;
    }

    const rolePerms = state.matrixData.matrix[state.currentUser.role] || {};
    return !!(rolePerms[section] && rolePerms[section].includes(action));
}

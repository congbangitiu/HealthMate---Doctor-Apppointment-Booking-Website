const memory = new Map();
const key = 'healthmate.support.guests';
export const getGuestRequests = () => {
    try {
        const entries = JSON.parse(localStorage.getItem(key) || '[]');
        for (const item of entries) if (typeof item.id === 'string' && typeof item.guestToken === 'string') memory.set(item.id, item);
    } catch { /* Storage may be unavailable; the current session can still chat. */ }
    return [...memory.values()];
};
export const rememberGuestRequest = (id, guestToken) => {
    getGuestRequests();
    memory.set(id, { id, guestToken });
    try { localStorage.setItem(key, JSON.stringify([...memory.values()].slice(-100))); } catch { /* Session fallback. */ }
};
export const guestTokenFor = (id) => getGuestRequests().find((entry) => entry.id === id)?.guestToken;

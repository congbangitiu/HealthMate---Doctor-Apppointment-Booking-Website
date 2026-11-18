import { useEffect, useState } from 'react';
const key = 'healthmate.support.guests';
const expiredKey = 'healthmate.support.expired';
const pendingKey = 'healthmate.support.recovery';
const changed = 'healthmate:guest-support-session';
let memory = [];
let migrated = false;
let memoryOnly = false;
let expired = false;
const valid = (entries) =>
    Array.isArray(entries)
        ? [
              ...new Map(
                  entries
                      .filter((item) => item && typeof item.id === 'string' && typeof item.guestToken === 'string')
                      .map(({ id, guestToken, expiresAt }) => [
                          id,
                          {
                              id,
                              guestToken,
                              ...(expiresAt && Number.isFinite(Date.parse(expiresAt)) ? { expiresAt } : {}),
                          },
                      ]),
              ).values(),
          ].slice(-100)
        : [];
const setExpired = (value) => {
    expired = value;
    try {
        if (value) sessionStorage.setItem(expiredKey, '1');
        else sessionStorage.removeItem(expiredKey);
    } catch {
        /* Memory fallback. */
    }
};
export const guestSessionExpired = () => {
    try {
        return memoryOnly ? expired : sessionStorage.getItem(expiredKey) === '1';
    } catch {
        return expired;
    }
};
const write = (entries) => {
    memory = valid(entries);
    try {
        sessionStorage.setItem(key, JSON.stringify(memory));
    } catch {
        memoryOnly = true;
    }
};
export const getGuestRequests = () => {
    if (!migrated) {
        migrated = true;
        try {
            const old = valid(JSON.parse(localStorage.getItem(key) || '[]'));
            const current = valid(JSON.parse(sessionStorage.getItem(key) || '[]'));
            if (old.length) write([...old, ...current]);
            localStorage.removeItem(key);
        } catch {
            /* Keep the current session usable if storage is restricted. */
        }
    }
    if (!memoryOnly) {
        try {
            memory = valid(JSON.parse(sessionStorage.getItem(key) || '[]'));
        } catch {
            /* Memory fallback. */
        }
    }
    const active = memory.filter((entry) => !entry.expiresAt || Date.parse(entry.expiresAt) > Date.now());
    if (active.length !== memory.length) {
        setExpired(true);
        write(active);
    }
    return memory;
};
const announce = () => window.dispatchEvent(new Event(changed));
export const rememberGuestRequests = (entries, expiresAt) => {
    write([...getGuestRequests(), ...entries.map((entry) => ({ ...entry, ...(expiresAt ? { expiresAt } : {}) }))]);
    setExpired(false);
    announce();
};
export const rememberGuestRequest = (id, guestToken) => rememberGuestRequests([{ id, guestToken }]);
export const forgetGuestRequests = (ids) => {
    const current = getGuestRequests();
    const active = current.filter((entry) => !ids.includes(entry.id));
    if (current.length !== active.length) {
        write(active);
        setExpired(true);
        announce();
    }
};
export const clearPendingRecovery = (token) => {
    try {
        const pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
        if (!token || pending?.token === token) sessionStorage.removeItem(pendingKey);
    } catch {
        /* Unavailable storage contains no usable pending link. */
    }
};
export const captureRecoveryToken = (hash) => {
    const params = new URLSearchParams(hash?.replace(/^#/, '') || '');
    if (params.has('token')) {
        const token = params.get('token');
        if (!/^[a-f0-9]{64}$/.test(token || '')) {
            clearPendingRecovery();
            return '';
        }
        try {
            const previous = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
            sessionStorage.setItem(
                pendingKey,
                JSON.stringify({
                    token,
                    expiresAt:
                        previous?.token === token && Number.isFinite(Date.parse(previous.expiresAt))
                            ? previous.expiresAt
                            : new Date(Date.now() + 15 * 60000).toISOString(),
                }),
            );
        } catch {
            /* The original email can reopen the link when storage is blocked. */
        }
        return token;
    }
    try {
        const pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
        if (pending && /^[a-f0-9]{64}$/.test(pending.token) && Date.parse(pending.expiresAt) > Date.now())
            return pending.token;
        clearPendingRecovery();
    } catch {
        /* No cached link. */
    }
    return '';
};
export const updatePendingRecoveryExpiry = (token, expiresAt) => {
    if (!Number.isFinite(Date.parse(expiresAt))) return;
    try {
        sessionStorage.setItem(pendingKey, JSON.stringify({ token, expiresAt }));
    } catch {
        /* Original link remains usable. */
    }
};
export const endGuestSupportSession = () => {
    write([]);
    setExpired(false);
    clearPendingRecovery();
    try {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    } catch {
        /* Memory is already cleared. */
    }
    announce();
};
export const guestTokenFor = (id) => getGuestRequests().find((entry) => entry.id === id)?.guestToken;
export const useGuestRequests = () => {
    const [entries, setEntries] = useState(getGuestRequests);
    useEffect(() => {
        const refresh = () => setEntries(getGuestRequests());
        window.addEventListener(changed, refresh);
        window.addEventListener('storage', refresh);
        window.addEventListener('focus', refresh);
        refresh();
        return () => {
            window.removeEventListener(changed, refresh);
            window.removeEventListener('storage', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, []);
    useEffect(() => {
        const deadlines = entries.map((entry) => Date.parse(entry.expiresAt)).filter(Number.isFinite);
        if (!deadlines.length) return;
        const timer = setTimeout(() => {
            setEntries(getGuestRequests());
            announce();
        }, Math.min(2147483647, Math.max(0, Math.min(...deadlines) - Date.now())));
        return () => clearTimeout(timer);
    }, [entries]);
    return entries;
};
export const guestProofs = (entries) => entries.map(({ id, guestToken }) => ({ requestId: id, guestToken }));

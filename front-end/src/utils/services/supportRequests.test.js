import { beforeEach, describe, expect, it, vi } from 'vitest';
const key = 'healthmate.support.guests';
let storage;
beforeEach(async () => {
    vi.resetModules();
    sessionStorage.clear();
    localStorage.clear();
    storage = await import('./supportRequests');
});
describe('guest support session storage', () => {
    it('preserves grant expiry and marks access expired when its deadline passes', () => {
        const expiresAt = new Date(Date.now() - 1000).toISOString();
        storage.rememberGuestRequests([{ id: 'a', guestToken: 'token' }], expiresAt);
        expect(storage.getGuestRequests()).toEqual([]);
        expect(storage.guestSessionExpired()).toBe(true);
        const nextExpiry = new Date(Date.now() + 60000).toISOString();
        storage.rememberGuestRequests([{ id: 'a', guestToken: 'new-token' }], nextExpiry);
        expect(storage.getGuestRequests()).toEqual([{ id: 'a', guestToken: 'new-token', expiresAt: nextExpiry }]);
        expect(storage.guestSessionExpired()).toBe(false);
    });
    it('retains a pending email link across reloads, respects expiry, and removes it after confirmation', () => {
        const token = 'a'.repeat(64);
        expect(storage.captureRecoveryToken('#token=' + token)).toBe(token);
        expect(storage.captureRecoveryToken('')).toBe(token);
        storage.updatePendingRecoveryExpiry(token, new Date(Date.now() - 1000).toISOString());
        expect(storage.captureRecoveryToken('')).toBe('');
        storage.captureRecoveryToken('#token=' + token);
        storage.clearPendingRecovery(token);
        expect(storage.captureRecoveryToken('')).toBe('');
    });
    it('removes unavailable credentials without losing other guest requests', () => {
        storage.rememberGuestRequests([
            { id: 'a', guestToken: 'a' },
            { id: 'b', guestToken: 'b' },
        ]);
        storage.forgetGuestRequests(['a']);
        expect(storage.getGuestRequests()).toEqual([{ id: 'b', guestToken: 'b' }]);
        expect(storage.guestSessionExpired()).toBe(true);
    });
    it('moves old persistent credentials into this tab once and removes the old copy', () => {
        localStorage.setItem(key, JSON.stringify([{ id: 'a', guestToken: 'secret-a', email: 'not-needed' }]));
        expect(storage.getGuestRequests()).toEqual([{ id: 'a', guestToken: 'secret-a' }]);
        expect(localStorage.getItem(key)).toBeNull();
        expect(JSON.parse(sessionStorage.getItem(key))).toEqual([{ id: 'a', guestToken: 'secret-a' }]);
    });
    it('keeps credentials in session storage and does not resurrect them after the tab storage is cleared', () => {
        storage.rememberGuestRequest('a', 'secret-a');
        expect(storage.guestTokenFor('a')).toBe('secret-a');
        expect(localStorage.getItem(key)).toBeNull();
        sessionStorage.clear();
        expect(storage.getGuestRequests()).toEqual([]);
    });
    it('ends the entire session, clears memory and announces the change to the header and page', () => {
        storage.rememberGuestRequest('a', 'secret-a');
        storage.rememberGuestRequest('b', 'secret-b');
        const changed = vi.fn();
        window.addEventListener('healthmate:guest-support-session', changed);
        storage.endGuestSupportSession();
        expect(storage.getGuestRequests()).toEqual([]);
        expect(sessionStorage.getItem(key)).toBeNull();
        expect(changed).toHaveBeenCalledOnce();
        window.removeEventListener('healthmate:guest-support-session', changed);
    });
    it('keeps the current page usable when storage writes are blocked', () => {
        storage.getGuestRequests();
        const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        storage.rememberGuestRequest('a', 'secret-a');
        expect(storage.guestTokenFor('a')).toBe('secret-a');
        storage.endGuestSupportSession();
        expect(storage.getGuestRequests()).toEqual([]);
        write.mockRestore();
    });
});

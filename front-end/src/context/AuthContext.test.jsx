import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const session = { user: { _id: 'patient-id', fullname: 'Test Patient' }, role: 'patient', token: 'test-access-token' };
const emptySession = { user: null, role: null, token: null };
const readSession = () => JSON.parse(screen.getByTestId('session').textContent);

async function loadAuth() {
    vi.resetModules();
    // Bootstrap state is evaluated at import. Keep the renderer and the reimported provider on one React instance.
    vi.doMock('react', () => React);
    return import('./AuthContext.jsx');
}

function renderSession(auth) {
    function SessionProbe() {
        const { user, role, token, dispatch } = React.useContext(auth.authContext);
        return (
            <>
                <output data-testid="session">{JSON.stringify({ user, role, token })}</output>
                <button onClick={() => dispatch({ type: 'LOGIN_START' })}>Start login</button>
                <button onClick={() => dispatch({ type: 'LOGIN_SUCCESS', payload: session })}>Complete login</button>
                <button onClick={() => dispatch({ type: 'LOGOUT' })}>Log out</button>
                <button onClick={() => dispatch({ type: 'UNKNOWN_ACTION' })}>Unknown action</button>
            </>
        );
    }
    return render(<auth.AuthContextProvider><SessionProbe /></auth.AuthContextProvider>);
}

function seedSession() {
    localStorage.setItem('user', JSON.stringify(session.user));
    localStorage.setItem('role', session.role);
    localStorage.setItem('token', session.token);
}

afterEach(() => vi.doUnmock('react'));

describe('AuthContextProvider', () => {
    it('FE-A01: starts logged out when storage is empty before module import', async () => {
        renderSession(await loadAuth());
        expect(readSession()).toEqual(emptySession);
    });

    it('FE-A02: clears the session when login starts', async () => {
        seedSession();
        renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Start login' }));
        expect(readSession()).toEqual(emptySession);
        expect(localStorage.getItem('token')).not.toBe(session.token);
    });

    it('FE-A03: exposes and persists the successful login payload', async () => {
        renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Complete login' }));
        expect(readSession()).toEqual(session);
        expect(JSON.parse(localStorage.getItem('user'))).toEqual(session.user);
        expect(localStorage.getItem('role')).toBe('patient');
        expect(localStorage.getItem('token')).toBe('test-access-token');
    });

    it('FE-A04: clears the active session on logout without requiring storage keys to stay absent', async () => {
        seedSession();
        renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(readSession()).toEqual(emptySession);
        expect(JSON.parse(localStorage.getItem('user'))).toBeNull();
        expect(localStorage.getItem('role')).not.toBe(session.role);
        expect(localStorage.getItem('token')).not.toBe(session.token);
        // The current effect writes string "null" after the reducer removes the keys.
    });

    it('FE-A05: preserves the session for an unknown action', async () => {
        seedSession();
        renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Unknown action' }));
        expect(readSession()).toEqual(session);
    });

    it.each(['{invalid-json', 'undefined'])(
        'FE-A06 [KNOWN BUG]: tolerates corrupted stored user value %s', async (storedUser) => {
            localStorage.setItem('user', storedUser);
            renderSession(await loadAuth());
            expect(readSession()).toEqual(emptySession);
        },
    );

    it('FE-A10: restores a valid stored session on a fresh module import', async () => {
        seedSession();
        renderSession(await loadAuth());
        expect(readSession()).toEqual(session);
    });

    it('FE-A11 [KNOWN BUG]: restores null session values after logout and a fresh module import', async () => {
        seedSession();
        const firstView = renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(readSession()).toEqual(emptySession);
        firstView.unmount();
        renderSession(await loadAuth());
        expect(readSession()).toEqual(emptySession);
    });
});

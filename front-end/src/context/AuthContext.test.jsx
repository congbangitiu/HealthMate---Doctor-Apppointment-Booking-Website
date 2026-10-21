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

    it('FE-A04: clears the active session and removes persisted credentials on logout', async () => {
        seedSession();
        renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(readSession()).toEqual(emptySession);
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('role')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('FE-A05: preserves the session for an unknown action', async () => {
        seedSession();
        renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Unknown action' }));
        expect(readSession()).toEqual(session);
    });

    it.each(['{invalid-json', 'undefined'])(
        'FE-A06 [REGRESSION]: tolerates corrupted stored user value %s', async (storedUser) => {
            localStorage.setItem('user', storedUser);
            renderSession(await loadAuth());
            expect(readSession()).toEqual(emptySession);
        },
    );

    it.each(['patient', 'doctor', 'admin'])('FE-A10: restores a valid stored %s session on a fresh import', async (role) => {
        seedSession();
        localStorage.setItem('role', role);
        renderSession(await loadAuth());
        expect(readSession()).toEqual({ ...session, role });
    });

    it('FE-A11 [REGRESSION]: restores null session values after logout and a fresh module import', async () => {
        seedSession();
        const firstView = renderSession(await loadAuth());
        await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
        expect(readSession()).toEqual(emptySession);
        firstView.unmount();
        renderSession(await loadAuth());
        expect(readSession()).toEqual(emptySession);
    });

    it.each(['null', 'undefined'])('FE-A12: migrates stored sentinel values "%s" to an empty session', async (value) => {
        localStorage.setItem('user', 'null');
        localStorage.setItem('role', value);
        localStorage.setItem('token', value);
        renderSession(await loadAuth());
        expect(readSession()).toEqual(emptySession);
        expect(localStorage.getItem('role')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('FE-A13: discards stale credentials when the stored user cannot be parsed', async () => {
        seedSession();
        localStorage.setItem('user', '{broken-json');
        renderSession(await loadAuth());
        expect(readSession()).toEqual(emptySession);
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('role')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });
});

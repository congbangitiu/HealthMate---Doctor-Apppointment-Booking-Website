import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { authContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function LoginPage() {
    const navigate = useNavigate();
    return <><p>Login page</p><button onClick={() => navigate(-1)}>Go back</button></>;
}

function renderRoute(value, allowedRoles = ['patient']) {
    return render(
        <authContext.Provider value={value}>
            <MemoryRouter initialEntries={['/origin', '/private']} initialIndex={1}
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/origin" element={<p>Origin page</p>} />
                    <Route path="/private" element={
                        <ProtectedRoute allowedRoles={allowedRoles}><p>Private content</p></ProtectedRoute>
                    } />
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </MemoryRouter>
        </authContext.Provider>,
    );
}

describe('ProtectedRoute', () => {
    it.each(['patient', 'doctor', 'admin'])(
        'FE-A07: renders private content when role %s is allowed and a token exists', (role) => {
            renderRoute({ role, token: 'test-token' }, [role]);
            expect(screen.getByText('Private content')).toBeInTheDocument();
            expect(screen.queryByText('Login page')).not.toBeInTheDocument();
        },
    );

    it.each([
        ['null token', { role: 'patient', token: null }, ['patient']],
        ['missing token', { role: 'patient' }, ['patient']],
        ['empty token', { role: 'patient', token: '' }, ['patient']],
        ['disallowed role', { role: 'patient', token: 'test-token' }, ['doctor']],
        ['empty role list', { role: 'patient', token: 'test-token' }, []],
    ])('FE-A08: redirects to login for %s without rendering private content', async (_label, value, allowedRoles) => {
        renderRoute(value, allowedRoles);
        expect(await screen.findByText('Login page')).toBeInTheDocument();
        expect(screen.queryByText('Private content')).not.toBeInTheDocument();
    });

    it('FE-A08: replaces the blocked history entry rather than adding another entry', async () => {
        renderRoute({ role: 'patient', token: null });
        await screen.findByText('Login page');
        await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
        expect(await screen.findByText('Origin page')).toBeInTheDocument();
        expect(screen.queryByText('Private content')).not.toBeInTheDocument();
    });

    it.each(['null', 'undefined'])(
        'FE-A09 [REGRESSION]: treats stored sentinel token "%s" as logged out', async (token) => {
            renderRoute({ role: 'patient', token });
            expect(screen.queryByText('Private content')).not.toBeInTheDocument();
            expect(await screen.findByText('Login page')).toBeInTheDocument();
        },
    );
});

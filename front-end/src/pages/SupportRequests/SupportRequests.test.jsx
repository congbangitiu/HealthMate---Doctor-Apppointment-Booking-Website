import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequests from './SupportRequests';
import { authContext } from '../../context/AuthContext';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
vi.mock('../../components/SupportChat/SupportChat', () => ({ default: ({ requestId }) => <div>chat:{requestId}</div> }));
const id = '507f1f77bcf86cd799439011';
beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, json: async () => url.endsWith('/mine')
        ? { data: [{ _id: id, category: 'technical' }] }
        : { data: { request: { _id: id, category: 'technical', message: 'Original issue' } } } })));
});
const mount = (token) => render(<MemoryRouter initialEntries={['/support-requests?request=' + id]}>
    <authContext.Provider value={{ token }}><SupportRequests /></authContext.Provider>
</MemoryRouter>);
describe('sender support request entry point', () => {
    it('opens an owning account conversation with the bearer token', async () => {
        mount('owner-token');
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith('/api/v1/contacts/mine', expect.objectContaining({ headers: { Authorization: 'Bearer owner-token' } }));
    });
    it('sends guest access in a header and never in a URL', async () => {
        localStorage.setItem('healthmate.support.guests', JSON.stringify([{ id, guestToken: 'guest-secret' }]));
        mount(null);
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/v1/contacts/' + id + '/conversation',
            expect.objectContaining({ headers: { 'X-Support-Token': 'guest-secret' } })));
        expect(fetch.mock.calls.every(([url]) => !url.includes('guest-secret'))).toBe(true);
    });
});

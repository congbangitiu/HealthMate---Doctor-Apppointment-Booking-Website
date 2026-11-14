import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportRequests from './SupportRequests';
import { authContext } from '../../context/AuthContext';

vi.mock('../../utils/services/socket', () => ({ default: { on: vi.fn(), off: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock('../../../config', () => ({ BASE_URL: '/api/v1' }));
vi.mock('../../components/SupportChat/SupportChat', () => ({ default: ({ requestId }) => <div>chat:{requestId}</div> }));
const id = '507f1f77bcf86cd799439011';
beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    localStorage.removeItem('healthmate.support.guests');
    vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, json: async () => url.endsWith('/mine')
        ? { data: [{ _id: id, category: 'technical', preview: 'I need help with my appointment.' }] }
        : { data: { request: { _id: id, category: 'technical', message: 'Original issue' } } } })));
});
const Path = () => <output data-testid="path">{useLocation().pathname + useLocation().search}</output>;
const mount = (token, path = '/support-requests?request=' + id) => render(<MemoryRouter initialEntries={[path]}>
    <authContext.Provider value={{ token }}><SupportRequests /><Path /></authContext.Provider>
</MemoryRouter>);
describe('sender support request entry point', () => {
    it('starts in the overview and opens a request, then returns without losing other query parameters', async () => {
        mount('owner-token', '/support-requests?keep=yes');
        const card = await screen.findByRole('button', { name: /contact:categories.technical/ });
        expect(screen.queryByRole('region', { name: 'requestDetails' })).not.toBeInTheDocument();
        expect(card).toHaveTextContent('I need help with my appointment.');
        expect(card).toHaveTextContent('#' + id);
        expect(fetch.mock.calls.some(([url]) => url.includes('/conversation'))).toBe(false);
        fireEvent.click(card);
        expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        expect(screen.getByTestId('path')).toHaveTextContent('keep=yes&request=' + id);
        expect(card).toHaveAttribute('aria-current', 'true');
        await waitFor(() => expect(screen.getByRole('heading', { name: 'contact:categories.technical' })).toHaveFocus());
        fireEvent.click(screen.getByRole('button', { name: 'backToRequests' }));
        expect(screen.queryByText('chat:' + id)).not.toBeInTheDocument();
        expect(screen.getByTestId('path')).toHaveTextContent('/support-requests?keep=yes');
        expect(card).toHaveFocus();
    });
    it('keeps the list available when opening an inaccessible conversation', async () => {
        fetch.mockImplementation(async (url) => ({ ok: url.endsWith('/mine'), json: async () => ({ data: [{ _id: id, category: 'technical' }] }) }));
        mount('owner-token');
        expect(await screen.findByRole('alert')).toHaveTextContent('forbidden');
        expect(screen.getByRole('button', { name: /contact:categories.technical/ })).toBeInTheDocument();
        expect(screen.queryByText('chat:' + id)).not.toBeInTheDocument();
    });
    it('opens an owning account conversation with the bearer token', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        mount('owner-token');
        expect(await screen.findByText('chat:' + id)).toBeInTheDocument();
        expect(screen.getAllByText('#' + id)).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: 'supportManagement:copyId' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'supportManagement:copied' })).toBeInTheDocument());
        expect(writeText).toHaveBeenCalledWith(id);
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

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../utils/services/i18n';
import Notifications from './Notifications';
import formatTimeAgo from '../../utils/date-time/formatTimeAgo';
vi.mock('../../hooks/useResponsive', () => ({ default: () => ({ isMobile: false }) }));
const request = { id: 'n1', requestId: 'r1', fullname: 'Jane Smith', senderRole: 'doctor',
    photo: '/jane.png', category: 'other', subject: 'Payment issue', kind: 'request',
    createdAt: '2026-11-01T10:43:00Z', requestCreatedAt: '2026-11-01T10:43:00Z' };
const Path = () => <output data-testid="path">{useLocation().pathname + useLocation().search}</output>;
const mount = (role, items = [request]) => {
    const close = vi.fn();
    render(<MemoryRouter><Notifications role={role} notifications={items} handleCloseNotifications={close} /><Path /></MemoryRouter>);
    return close;
};
beforeEach(async () => { await i18n.changeLanguage('en'); });
describe('shared notification popup', () => {
    it('shows the requester avatar, doctor prefix and original submission date in Vietnam time', () => {
        mount('admin');
        const image = screen.getByRole('img', { name: 'Jane Smith' });
        expect(image).toHaveAttribute('src', '/jane.png');
        expect(screen.getByRole('button', { name: /Dr. Jane Smith submitted a support request/ })).toHaveTextContent(
            'Dr. Jane Smith submitted a support request Payment issue from Nov 1, 2026 at 05:43 PM');
        fireEvent.error(image);
        expect(image.getAttribute('src')).toContain('default-notification-avatar.svg');
    });
    it('caps the feed at six visible items and opens all support requests', async () => {
        const close = mount('admin', Array.from({ length: 8 }, (_, i) => ({ ...request, id: 'n' + i, subject: 'Issue ' + i, isRead: i % 2 === 0 })));
        expect(screen.getAllByRole('img')).toHaveLength(6);
        expect(screen.getAllByText(/Unread/)).toHaveLength(3);
        expect(screen.queryByText('Issue 6')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'View all' }));
        expect(screen.getByTestId('path')).toHaveTextContent('/admins/management/support');
        expect(close).toHaveBeenCalledOnce();
    });
    it.each([
        ['doctor', '/doctors/profile/me?tab=appointments'], ['patient', '/users/profile/me'],
    ])('opens the appointment list for %s', async (role, path) => {
        mount(role, []);
        await userEvent.click(screen.getByRole('button', { name: 'View all' }));
        expect(screen.getByTestId('path')).toHaveTextContent(path);
    });
    it.each([
        [60, 'minute'], [3600, 'hour'], [86400, 'day'], [30 * 86400, 'month'], [360 * 86400, 'year'],
    ])('uses English singular and plural for %s seconds per unit', (seconds, unit) => {
        const now = Date.now();
        expect(formatTimeAgo(new Date(now - seconds * 1000))).toBe('1 ' + unit + ' ago');
        expect(formatTimeAgo(new Date(now - seconds * 2000))).toBe('2 ' + unit + 's ago');
    });
    it('translates the footer and support message into Vietnamese', async () => {
        await i18n.changeLanguage('vi');
        mount('admin');
        expect(screen.getByRole('button', { name: 'Hi\u1ec3n th\u1ecb t\u1ea5t c\u1ea3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /BS\. Jane Smith \u0111\u00e3 g\u1eedi y\u00eau c\u1ea7u h\u1ed7 tr\u1ee3/ })).toHaveTextContent('17:43');
    });
});

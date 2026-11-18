import PropTypes from 'prop-types';
import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import ContentChat from './ContentChat';
import socket from '../../utils/services/socket';
import { uploadImageToCloudinary } from '../../utils/services/uploadCloudinary';

vi.mock('../../../config', () => ({ BASE_URL: '/api/v1', token: 'legacy-token' }));
vi.mock('../../utils/services/socket', () => ({ default: { emit: vi.fn() } }));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
vi.mock('@emoji-mart/react', () => ({
    default: ({ onEmojiSelect }) => (
        <button type="button" onClick={() => onEmojiSelect({ native: '[emoji]' })}>
            Choose emoji
        </button>
    ),
}));
vi.mock('@emoji-mart/data', () => ({ default: {} }));
vi.mock('antd', async () => {
    const { default: types } = await import('prop-types');
    const Image = ({ src, onLoad, className }) => (
        <img src={src} onLoad={onLoad} className={className} alt="Message image" />
    );
    Image.propTypes = { src: types.string, onLoad: types.func, className: types.string };
    return { Image };
});
vi.mock('../../utils/services/uploadCloudinary', () => ({
    uploadImageToCloudinary: vi.fn(),
    uploadVideoToCloudinary: vi.fn(),
    uploadDocumentToCloudinary: vi.fn(),
}));
const original = {
    _id: 'm1',
    type: 'text',
    content: 'Original message',
    sender: { _id: 'patient-1' },
    timestamp: '2026-11-01T09:00:00Z',
};
const makeChat = (messages) => ({
    _id: 'chat-1',
    messages,
    user: { _id: 'patient-1', fullname: 'Patient One', photo: '/patient.png', status: 'online' },
    doctor: { _id: 'doctor-1', fullname: 'Doctor One', photo: '/doctor.png', status: 'online' },
});
const Host = ({ role = 'patient', messages = [original], onBack = vi.fn(), isMobile = false }) => {
    const [chat, setChat] = useState(() => makeChat(messages));
    return (
        <ContentChat
            selectedChat={chat}
            setSelectedChat={setChat}
            userId={role === 'doctor' ? 'doctor-1' : 'patient-1'}
            role={role}
            onBack={onBack}
            isMobile={isMobile}
        />
    );
};

Host.propTypes = {
    role: PropTypes.string,
    messages: PropTypes.array,
    onBack: PropTypes.func,
    isMobile: PropTypes.bool,
};
const editor = () => screen.getByPlaceholderText('content.writeMessage');
const sendControl = (container) => container.querySelector('[class*="send-part"]');
const openMenu = (container) => fireEvent.click(container.querySelector('[class*="modes"] > svg'));
const scroll = vi.fn();
beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scroll });
    axios.post.mockResolvedValue({ status: 200 });
    uploadImageToCloudinary.mockResolvedValue({
        secure_url: 'https://media.example/image.png',
        original_filename: 'image',
        bytes: 10,
    });
});

describe('ContentChat reuse regression', () => {
    it('renders support directly and delegates typing, emoji and sending without legacy API/socket calls', () => {
        const onSend = vi.fn((event) => event.preventDefault());
        const onDraftChange = vi.fn();
        const support = {
            requestId: 'request-1',
            assignee: { id: 'assigned', fullname: 'Assigned Admin', photo: '/assigned.png' },
            messages: [],
            viewer: { role: 'patient', id: 'owner' },
            loading: false,
            connected: true,
            hasMore: false,
            olderLoading: false,
            draft: 'Hello',
            onDraftChange,
            sending: false,
            error: '',
            onLoadOlder: vi.fn(),
            onRetry: vi.fn(),
            onSend,
        };
        const { container } = render(<ContentChat support={support} />);
        expect(screen.getByRole('log', { name: 'messages' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Assigned Admin' })).toBeInTheDocument();
        const avatar = screen.getByRole('img', { name: 'Assigned Admin' });
        expect(avatar).toHaveAttribute('src', '/assigned.png');
        fireEvent.error(avatar);
        expect(screen.queryByRole('img', { name: 'Assigned Admin' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Assigned Admin' })).toBeInTheDocument();
        expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
        expect(container.querySelector('[class*="modes"]')).not.toBeInTheDocument();
        const input = screen.getByLabelText('messageLabel');
        fireEvent.change(input, { target: { value: 'New draft' } });
        expect(onDraftChange).toHaveBeenCalledWith('New draft');
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
        expect(onSend).not.toHaveBeenCalled();
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onSend).toHaveBeenCalledTimes(1);
        onSend.mockClear();
        fireEvent.click(container.querySelector('[class*="type-part"] > div:last-child'));
        fireEvent.click(screen.getByRole('button', { name: 'Choose emoji' }));
        expect(onDraftChange).toHaveBeenCalledWith('Hello[emoji]');
        fireEvent.click(screen.getByRole('button', { name: 'send' }));
        expect(onSend).toHaveBeenCalledTimes(1);
        expect(socket.emit).not.toHaveBeenCalled();
        expect(axios.post).not.toHaveBeenCalled();
    });
    it('keeps owner-only edit/delete actions hidden for incoming messages', () => {
        const { container } = render(<Host role="doctor" />);
        openMenu(container);
        expect(screen.queryByText('content.editMessage')).not.toBeInTheDocument();
        expect(screen.queryByText('content.removeForEveryone')).not.toBeInTheDocument();
        expect(screen.getByText('content.removeForYou')).toBeInTheDocument();
    });
    it('preserves the mobile back control', () => {
        const onBack = vi.fn();
        const { container } = render(<Host isMobile onBack={onBack} />);
        fireEvent.click(container.querySelector('[class*="info"] > svg'));
        expect(onBack).toHaveBeenCalledTimes(1);
        expect(socket.emit).not.toHaveBeenCalled();
    });
    it('can cancel an edit without API calls or sending a message', () => {
        const { container } = render(<Host />);
        openMenu(container);
        fireEvent.click(screen.getByText('content.editMessage'));
        fireEvent.click(container.querySelector('[class*="edit-part"] > svg'));
        expect(editor()).toHaveValue('');
        expect(axios.post).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
    });
    it('keeps the empty selection prompt', () => {
        render(<ContentChat selectedChat={null} />);
        expect(screen.getByText('content.selectChatPrompt')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('content.writeMessage')).not.toBeInTheDocument();
    });
    it.each([
        ['patient', 'click', 'User'],
        ['doctor', 'enter', 'Doctor'],
    ])('preserves %s text sending via %s', (role, method, model) => {
        const { container } = render(<Host role={role} />);
        fireEvent.change(editor(), { target: { value: ' Hello ' } });
        if (method === 'enter') fireEvent.keyDown(editor(), { key: 'Enter' });
        else fireEvent.click(sendControl(container));
        expect(socket.emit).toHaveBeenCalledWith('send-message', {
            chatId: 'chat-1',
            senderId: role === 'doctor' ? 'doctor-1' : 'patient-1',
            senderModel: model,
            type: 'text',
            content: 'Hello',
        });
        expect(editor()).toHaveValue('');
    });
    it('does not send empty text and preserves link classification', () => {
        const { container } = render(<Host />);
        fireEvent.click(sendControl(container));
        expect(socket.emit).not.toHaveBeenCalled();
        fireEvent.change(editor(), { target: { value: 'https://example.com' } });
        fireEvent.click(sendControl(container));
        expect(socket.emit).toHaveBeenCalledWith(
            'send-message',
            expect.objectContaining({ type: 'link', content: 'https://example.com' }),
        );
    });
    it('edits through the existing API and edit-message event, without sending a duplicate message', async () => {
        const { container } = render(<Host />);
        openMenu(container);
        fireEvent.click(screen.getByText('content.editMessage'));
        expect(editor()).toHaveValue('Original message');
        fireEvent.change(editor(), { target: { value: 'Edited message' } });
        fireEvent.click(sendControl(container));
        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith(
                '/api/v1/chats/handle-message-action',
                {
                    chatId: 'chat-1',
                    messageId: 'm1',
                    actionType: 'edit',
                    newContent: 'Edited message',
                    userId: 'patient-1',
                },
                { headers: { Authorization: 'Bearer legacy-token' } },
            ),
        );
        expect(await screen.findByText('Edited message')).toBeInTheDocument();
        expect(socket.emit).toHaveBeenCalledWith('edit-message', {
            chatId: 'chat-1',
            messageId: 'm1',
            newContent: 'Edited message',
            userId: 'patient-1',
        });
        expect(socket.emit.mock.calls.some(([event]) => event === 'send-message')).toBe(false);
    });
    it('preserves local hiding without issuing a server deletion', () => {
        const { container } = render(<Host />);
        openMenu(container);
        fireEvent.click(screen.getByText('content.removeForYou'));
        expect(screen.getByText('content.noMessageYet')).toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem('hiddenMessages_patient-1'))).toContain('m1');
        expect(axios.post).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
    });
    it('preserves server deletion and the remove-message event', async () => {
        const { container } = render(<Host />);
        openMenu(container);
        fireEvent.click(screen.getByText('content.removeForEveryone'));
        await screen.findByText('content.noMessageYet');
        expect(axios.post).toHaveBeenCalledWith(
            '/api/v1/chats/handle-message-action',
            {
                chatId: 'chat-1',
                messageId: 'm1',
                actionType: 'removeForEveryone',
                userId: 'patient-1',
            },
            { headers: { Authorization: 'Bearer legacy-token' } },
        );
        expect(socket.emit).toHaveBeenCalledWith('remove-message', {
            chatId: 'chat-1',
            messageId: 'm1',
            userId: 'patient-1',
        });
    });
    it('keeps attachment upload, preview and the media send payload', async () => {
        const { container } = render(<Host />);
        fireEvent.change(container.querySelector('input[type="file"]'), {
            target: { files: [new File(['image'], 'image.png', { type: 'image/png' })] },
        });
        await waitFor(() => expect(container.querySelector('[class*="file-part"] img')).toBeInTheDocument());
        fireEvent.click(sendControl(container));
        expect(uploadImageToCloudinary).toHaveBeenCalledTimes(1);
        expect(socket.emit).toHaveBeenCalledWith(
            'send-message',
            expect.objectContaining({
                chatId: 'chat-1',
                senderId: 'patient-1',
                senderModel: 'User',
                type: 'media',
                mediaType: 'image',
                content: 'https://media.example/image.png',
            }),
        );
        expect(container.querySelector('[class*="file-part"]')).not.toBeInTheDocument();
    });
    it('keeps the emoji picker in the composer', () => {
        const { container } = render(<Host />);
        fireEvent.click(container.querySelector('[class*="type-part"] > div:last-child'));
        fireEvent.click(screen.getByRole('button', { name: 'Choose emoji' }));
        expect(editor()).toHaveValue('[emoji]');
    });
    it('renders media, documents and links with the original controls', () => {
        const messages = [
            { ...original, _id: 'img', type: 'media', mediaType: 'image', content: '/image.png' },
            { ...original, _id: 'vid', type: 'media', mediaType: 'video', content: '/video.mp4' },
            {
                ...original,
                _id: 'doc',
                type: 'document',
                content: '/record.pdf',
                documentDetails: { documentName: 'Record', documentType: 'pdf', documentSize: 100 },
            },
            { ...original, _id: 'link', type: 'link', content: 'https://example.com' },
        ];
        const { container } = render(<Host messages={messages} />);
        expect(screen.getByRole('img', { name: 'Message image' })).toHaveAttribute('src', '/image.png');
        expect(container.querySelector('video')).toHaveAttribute('controls');
        expect(screen.getByText('Record.pdf')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute('rel', 'noopener noreferrer');
    });
    it('cleans up delayed scroll work on unmount', () => {
        vi.useFakeTimers();
        const { unmount } = render(<Host />);
        const count = scroll.mock.calls.length;
        unmount();
        act(() => vi.advanceTimersByTime(300));
        expect(scroll).toHaveBeenCalledTimes(count);
    });
});

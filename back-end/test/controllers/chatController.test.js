import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

const mocks = vi.hoisted(() => ({ Chat: { findById: vi.fn() }, populate: vi.fn() }));
vi.mock('../../Models/ChatSchema.js', () => ({ default: mocks.Chat }));

import { handleMessageAction } from '../../Controllers/chatController.js';

const senderId = '507f1f77bcf86cd799439011';
const messageIds = ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'];
let chat;

const response = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};
const request = (overrides = {}) => ({
    userId: senderId,
    body: { chatId: 'chat-id', messageId: messageIds[1], actionType: 'edit', newContent: 'Updated content', userId: senderId, ...overrides },
});

const queryFor = (result) => {
    const query = {
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
        populate: (...args) => { mocks.populate(...args); return query; },
    };
    return query;
};

beforeEach(() => {
    vi.resetAllMocks();
    chat = {
        _id: 'chat-id',
        messages: messageIds.map((id, index) => ({
            _id: new mongoose.Types.ObjectId(id), sender: new mongoose.Types.ObjectId(senderId),
            content: `Original ${index}`, timestamp: new Date('2026-10-21T10:00:00+07:00'),
        })),
        save: vi.fn().mockResolvedValue(undefined),
    };
    mocks.Chat.findById.mockImplementation(() => queryFor(chat));
});

describe('handleMessageAction', () => {
    it('BE-CH01: returns 404 without saving when the chat does not exist', async () => {
        const save = chat.save;
        chat = null;
        const res = response();
        await handleMessageAction(request(), res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Chat not found' });
        expect(save).not.toHaveBeenCalled();
        expect(mocks.Chat.findById).toHaveBeenCalledTimes(1);
    });

    it('BE-CH01: returns 404 without modifying messages when the target message does not exist', async () => {
        const previous = chat.messages.slice();
        const res = response();
        await handleMessageAction(request({ messageId: 'missing-message' }), res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
        expect(chat.messages).toEqual(previous);
        expect(chat.save).not.toHaveBeenCalled();
    });

    it.each(['edit', 'removeForEveryone'])('BE-CH02: denies %s when the claimed user is not the sender', async (actionType) => {
        const res = response();
        await handleMessageAction(request({ actionType, userId: 'another-user-id' }), res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Permission denied' });
        expect(chat.messages).toHaveLength(3);
        expect(chat.messages[1].content).toBe('Original 1');
        expect(chat.save).not.toHaveBeenCalled();
    });

    it('BE-CH03: edits only the selected message and responds with the reloaded chat', async () => {
        const originalTimestamp = chat.messages[1].timestamp;
        const reloadedChat = { _id: 'chat-id', messages: [{ content: 'Reloaded content' }] };
        mocks.Chat.findById.mockReturnValueOnce(queryFor(chat)).mockReturnValueOnce(queryFor(reloadedChat));
        const res = response();
        await handleMessageAction(request(), res);
        expect(chat.messages.map((item) => item.content)).toEqual(['Original 0', 'Updated content', 'Original 2']);
        expect(chat.messages[1]._id.toString()).toBe(messageIds[1]);
        expect(chat.messages[1].sender.toString()).toBe(senderId);
        expect(chat.messages[1].timestamp).toBe(originalTimestamp);
        expect(chat.save).toHaveBeenCalledTimes(1);
        expect(mocks.Chat.findById.mock.calls).toEqual([['chat-id'], ['chat-id']]);
        expect(mocks.populate.mock.calls).toEqual([
            ['doctor', 'fullname photo'], ['user', 'fullname photo'],
            ['doctor', 'fullname photo'], ['user', 'fullname photo'], ['messages.sender', 'fullname'],
        ]);
        expect(chat.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.Chat.findById.mock.invocationCallOrder[1]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Action performed successfully', chat: reloadedChat });
    });

    it.each([0, 1, 2])('BE-CH04: removes only the target message at index %i', async (index) => {
        const res = response();
        await handleMessageAction(request({ actionType: 'removeForEveryone', messageId: messageIds[index] }), res);
        expect(chat.messages.map((item) => item._id.toString())).toEqual(messageIds.filter((_id, position) => position !== index));
        expect(chat.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it.each(['unsupported', '', undefined])('BE-CH05: rejects unsupported action %s without saving', async (actionType) => {
        const res = response();
        await handleMessageAction(request({ actionType }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid action type' });
        expect(chat.save).not.toHaveBeenCalled();
        expect(chat.messages[1].content).toBe('Original 1');
    });

    it.each(['initial lookup', 'save', 'reload'])('BE-CH06: returns 500 when %s fails', async (stage) => {
        const error = new Error('database unavailable');
        if (stage === 'initial lookup') mocks.Chat.findById.mockImplementation(() => { throw error; });
        if (stage === 'save') chat.save.mockRejectedValue(error);
        if (stage === 'reload') mocks.Chat.findById.mockReturnValueOnce(queryFor(chat)).mockImplementationOnce(() => { throw error; });
        const res = response();
        await handleMessageAction(request(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to perform action on message', details: 'database unavailable' });
        if (stage === 'initial lookup') expect(chat.save).not.toHaveBeenCalled();
        if (stage === 'reload') expect(chat.save).toHaveBeenCalledTimes(1);
        // Reload failure happens after a successful save; a 500 response does not prove rollback.
    });

    it.each(['edit', 'removeForEveryone'])('BE-CH07 [KNOWN BUG]: rejects forged sender identity for action %s', async (actionType) => {
        const req = request({ actionType, userId: senderId });
        req.userId = 'authenticated-other-user';
        const res = response();
        await handleMessageAction(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(chat.save).not.toHaveBeenCalled();
    });

    it.todo('BE-CH07: rejects unauthenticated or forged requests through the actual Express chat route (HTTP integration)');
});

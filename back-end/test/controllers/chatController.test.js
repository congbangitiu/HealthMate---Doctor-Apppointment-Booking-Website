import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import process from 'node:process';

const mocks = vi.hoisted(() => ({ Chat: { findById: vi.fn() }, populate: vi.fn() }));
vi.mock('../../Models/ChatSchema.js', () => ({ default: mocks.Chat }));

import { handleMessageAction } from '../../Controllers/chatController.js';
import chatRouter from '../../Routes/chat.js';

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

    it.each(['edit', 'removeForEveryone'])('BE-CH07: rejects forged sender identity for action %s', async (actionType) => {
        const req = request({ actionType, userId: senderId });
        req.userId = 'authenticated-other-user';
        const res = response();
        await handleMessageAction(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(chat.save).not.toHaveBeenCalled();
    });

});

describe('authenticated message action HTTP route (mocked database)', () => {
    let server;
    let url;
    beforeAll(async () => {
        const app = express();
        app.use(express.json());
        app.use('/chats', chatRouter);
        server = createServer(app);
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        url = `http://127.0.0.1:${server.address().port}/chats/handle-message-action`;
    });
    afterAll(async () => {
        if (server) await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
    });
    const post = (token, body = request().body) => fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
    });
    const tokenFor = (id) => jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET_KEY, { expiresIn: '5m' });

    it.each([undefined, 'invalid-token'])('BE-CH07 HTTP: denies missing or invalid authentication: %s', async (token) => {
        const res = await post(token);
        expect(res.status).toBe(401);
        expect(mocks.Chat.findById).not.toHaveBeenCalled();
    });
    it.each(['edit', 'removeForEveryone'])('BE-CH07 HTTP: prevents a valid token from impersonating the sender for %s', async (actionType) => {
        const res = await post(tokenFor('another-user-id'), request({ actionType }).body);
        expect(res.status).toBe(403);
        expect(chat.save).not.toHaveBeenCalled();
        expect(chat.messages[1].content).toBe('Original 1');
    });
    it.each(['edit', 'removeForEveryone'])('BE-CH07 HTTP: permits the authenticated sender to perform %s', async (actionType) => {
        const res = await post(tokenFor(senderId), request({ actionType }).body);
        expect(res.status).toBe(200);
        expect(chat.save).toHaveBeenCalledTimes(1);
        if (actionType === 'edit') expect(chat.messages[1].content).toBe('Updated content');
        else expect(chat.messages).toHaveLength(2);
    });
    it('BE-CH07 HTTP: uses authenticated identity when body userId is omitted', async () => {
        const body = request().body;
        delete body.userId;
        const res = await post(tokenFor(senderId), body);
        expect(res.status).toBe(200);
        expect(chat.messages[1].content).toBe('Updated content');
    });
    it('BE-CH07 HTTP: rejects an unrelated authenticated sender even without a claimed body identity', async () => {
        const body = request().body;
        delete body.userId;
        const res = await post(tokenFor('another-user-id'), body);
        expect(res.status).toBe(403);
        expect(chat.save).not.toHaveBeenCalled();
    });
});

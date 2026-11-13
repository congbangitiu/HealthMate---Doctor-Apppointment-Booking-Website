import { getSupportAccount, getSupportAccess } from '../utils/supportAccess.js';
import { SUPPORT_ADMIN_ROOM, supportRequestRoom, supportOwnerRoom } from '../utils/supportRealtime.js';

const supportSocketHandler = (io) => {
    io.on('connection', (socket) => {
        const subscriptions = new Map();
        // Serialize async subscribe/unsubscribe so an old auth response cannot rejoin after logout.
        let queue = Promise.resolve();
        const enqueue = (work) => {
            queue = queue.then(work).catch(() => {});
        };
        const leave = async (key) => {
            const entry = subscriptions.get(key);
            if (entry) {
                clearTimeout(entry.timer);
                await socket.leave(entry.room);
                subscriptions.delete(key);
            }
        };
        const join = async (key, room, expiresAt) => {
            await leave(key);
            if (!socket.connected) throw new Error('disconnected');
            if (expiresAt && expiresAt <= Date.now()) throw new Error('expired');
            await socket.join(room);
            const timer = expiresAt
                ? setTimeout(
                      () => {
                          void leave(key);
                      },
                      Math.min(expiresAt - Date.now(), 2147483647),
                  )
                : undefined;
            timer?.unref?.();
            subscriptions.set(key, { room, timer });
        };
        socket.on('admin-support-subscribe', (payload = {}, acknowledge = () => {}) =>
            enqueue(async () => {
                try {
                    await leave('admin');
                    const account = await getSupportAccount(payload.token);
                    if (account.role !== 'admin') throw new Error('forbidden');
                    await join('admin', SUPPORT_ADMIN_ROOM, account.expiresAt);
                    if (typeof acknowledge === 'function') acknowledge({ success: true });
                } catch {
                    if (typeof acknowledge === 'function') acknowledge({ success: false });
                }
            }),
        );
        socket.on('admin-support-unsubscribe', () => enqueue(() => leave('admin')));
        socket.on('owner-support-subscribe', (payload = {}, acknowledge = () => {}) =>
            enqueue(async () => {
                try {
                    await leave('owner');
                    const account = await getSupportAccount(payload.token);
                    if (!['patient', 'doctor'].includes(account.role)) throw new Error('forbidden');
                    await join('owner', supportOwnerRoom(account.role, account.id), account.expiresAt);
                    if (typeof acknowledge === 'function') acknowledge({ success: true });
                } catch {
                    if (typeof acknowledge === 'function') acknowledge({ success: false });
                }
            }),
        );
        socket.on('owner-support-unsubscribe', () => enqueue(() => leave('owner')));
        socket.on('support-chat-subscribe', (payload = {}, acknowledge = () => {}) =>
            enqueue(async () => {
                try {
                    // One support conversation per socket; it never trusts a supplied sender ID or role.
                    await leave('chat');
                    const { request, account } = await getSupportAccess(payload);
                    await join('chat', supportRequestRoom(request._id), account.expiresAt);
                    if (typeof acknowledge === 'function') acknowledge({ success: true });
                } catch {
                    if (typeof acknowledge === 'function') acknowledge({ success: false });
                }
            }),
        );
        socket.on('support-chat-unsubscribe', () => enqueue(() => leave('chat')));
        socket.on('disconnect', () => {
            for (const entry of subscriptions.values()) clearTimeout(entry.timer);
            subscriptions.clear();
        });
    });
};
export default supportSocketHandler;

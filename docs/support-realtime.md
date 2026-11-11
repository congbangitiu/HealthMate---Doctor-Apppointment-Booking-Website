# Support realtime and conversations

Deploy/restart backend and frontend together. This feature uses the existing MongoDB, JWT_SECRET_KEY and Socket.IO server; no extra service or secret is required.
The frontend's existing VITE_REACT_PUBLIC_SOCKET_URL must point to the backend Socket.IO endpoint.

## Admin

- Header bell loads GET /api/v1/contacts/notifications on login, reconnect, focus and every 30 seconds while visible.
- Live support notifications play the existing bell sound and shake the bell once per new event; no toast is shown. The bell badge counts **unread requests**, not individual messages.
- Clicking a notification opens /admins/management/support?request=<id>.
- Opening a request marks it read for that admin only; opening the bell does not mark everything read.
- The Requests list refreshes on support events, reconnect and focus. It does not reload on a periodic timer.
- The request popup contains a support conversation. Internal processing notes remain separate and admin-only.

## Sender

- After submitting Contact, use Open support conversation.
- Contact also links to /support-requests, where signed-in patients/doctors can return to their own requests.
- Guests receive a random request-specific capability. Only its SHA-256 hash is stored on the server.
- Guest credentials stay in this browser's local storage and are sent using X-Support-Token, never in a URL or notification.
- Clearing browser data loses guest access. Sharing a request URL alone does not give access.
- Existing signed-in requests can use chat. Guest requests created before this feature have no issued capability and cannot be recovered by supplying a name/email alone.

## Persistence and security

A saved SupportRequest itself identifies the conversation, so creating a request and its channel is one database write.
Text messages persist in SupportMessage, with cursor-based history (50 messages per page).
A unique request/participant/clientId index makes retries idempotent. Failed sends retain the draft and nonce.
Realtime events are emitted after persistence; transport failures do not turn a committed submission/message into a failure.
The original request description is displayed above the conversation.

Room names:
- support:admins: JWT verification plus database-confirmed admin role.
- support:request:<id>: verified admin, owning signed-in account, or the matching guest capability.

JWT subscriptions leave on token expiry. Subscribe/unsubscribe operations are serialized to avoid a delayed subscribe surviving logout.
Legacy raw-room join events accept only ObjectId strings, preventing them from bypassing protected support room checks.
Message authors are derived from verified credentials. Client-supplied sender IDs/roles are ignored.
Sender APIs omit internal notes, IP hashes and guest access hashes.

Socket.IO events:
- admin-support-subscribe / admin-support-unsubscribe
- support-notification (new request or sender message)
- support-requests-changed (read/processing changes)
- support-chat-subscribe / support-chat-unsubscribe
- support-chat-changed

Chat delivery uses authenticated HTTP writes and Socket.IO invalidation/refetch. Reconnect, focus and a 15-second visible-page fallback recover missed messages.
The sender can load earlier history. Notifications are restored from request records when an admin was offline.

## Scope

This release supports text conversation in the website. It does not request browser notification permission or send Web Push/email.
No messages or notifications are delivered by this feature while the browser is closed.
The previous doctor/patient chat routes and UI remain in use for appointment chat.

The shared notification popup shows at most six items and a View all action. Admins open support management; doctors open the appointments tab; patients open their appointment list. Support notifications resolve the sender avatar from the account, use a default avatar for guests, and display the original submission time in Vietnam time. English relative times use the i18next singular/plural keys.

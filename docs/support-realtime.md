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

## Signed-in sender notifications

Patient and doctor accounts receive persisted support status/reply notifications. GET /contacts/my-notifications derives ownership from a verified account and returns the latest update per request, with a full unread-request count. POST /contacts/my-notifications/read matches both the owning account and the exact notification ID; viewing an older update cannot clear a newer one.

Status changes save owner notification metadata atomically with the status. New admin replies save their notification metadata after the reply is persisted. Delivery failures never turn a saved status/reply into an error. Internal notes and assignment changes do not create sender notifications.

owner-support-subscribe verifies the JWT and actual database role and joins support:owner:<role>:<id>; the client cannot choose the target identity. The shared Header merges support updates with appointment notifications, plays the bell once per new live event, and restores the feed on login/reconnect/focus/visibility without replaying historical sounds. No toast is used.

Clicking a support notification opens /support-requests?request=<id>. Opening a conversation marks only the update present at that visit as read for its signed-in owner while visible. Later background sync does not clear new updates; clicking their notification or reopening the request acknowledges them. Other open tabs update their unread counts via owner-support-changed. The Contact link to My support requests is centered below Submit. Guest notification delivery is deferred; existing guest conversation access is unchanged.

Support updates carry the acting admin name and current account avatar. Existing updates resolve the actor from processing history or the stored reply when actor metadata is absent. Avatar lookup failures use a neutral fallback and never undo a saved status/reply. Live socket IDs are deduplicated independently from HTTP feed restoration; the badge updates immediately before the confirming fetch. The shared audio element is unlocked on a pointer/keyboard interaction, and autoplay-blocked alerts retry on the next interaction.

The sender request page starts with a responsive card grid (three columns on wide screens, two on tablets, one on phones). Selecting a card uses the existing request query parameter to reveal a vertical sidebar plus the request details and conversation. All requests clears only that query parameter and restores keyboard focus to the selected card. On phones the selected detail uses the full width; All requests returns to the overview. Background list refreshes keep existing cards visible.

SupportRequests, SupportChat and Contact support actions share SCSS primitives in src/styles/_support.scss, based on the existing GlobalStyle.css palette. Request cards use plain borders and text statuses, selected requests use a vertical accent, and the sender conversation uses an embedded presentation to avoid nested panels. Shared SupportChat retains its default framed presentation inside admin details. Body text is 16px and secondary text is 14px.

The signed-in request list includes a whitespace-normalized preview capped at 180 characters; the full issue is still loaded through the authorized conversation endpoint. Cards show a one-line preview in the overview and hide it in the compact sidebar. Hover/focus reveals the open arrow, while touch devices keep it visible. Reduced-motion preferences disable the transition.

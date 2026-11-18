# Guest support

Guest access represents permission to one support request, not a verified person. The existing CAPTCHA, validation, message nonce deduplication and server-side token hashing remain in use.

## Lifecycle

- Submitting the Contact form returns a random guestToken once. Only its SHA-256 hash is stored in the request record.
- The browser stores request ID/token pairs in sessionStorage, with a current-page memory fallback when storage writes are blocked. The previous localStorage credentials migrate into the current tab once and are removed from localStorage.
- Requests appear in My support requests with real subjects, dates, statuses, unread markers and message previews. Signed-in account lists do not merge guest requests or send guest credentials.
- While the application is open, the Header subscribes to each guest's notification room after server-side capability checks. Admin status changes and replies save the notification before emitting. Internal notes and assignment changes do not create owner bell notifications.
- The existing notification popup, bell sound and unread badge are reused. Only a new support request notification for an admin uses the subject; subsequent notifications use #requestId. Guest View all opens /support-requests.
- Reload, reconnect, browser focus and visibility restoration reload the persisted notification feed. Initial/restored notices do not play a historical sound. Each live event sounds once, subject to browser audio policies.
- Opening a notice/chat marks the exact viewed notification ID read; an older read cannot clear a newer notification. Active chat also acknowledges new updates when the tab and chat bottom are visible and the reader is at the newest messages. Notification storage retains the latest update per request, as for signed-in owners.
- End support session asks for confirmation, deletes credentials from this tab, clears the guest list/badge, unmounts its chat and unsubscribes guest rooms. It does not delete support requests or revoke capability copies held by another session.

## API and socket boundaries

- POST /contacts/guest-notifications: body { requests: [{ requestId, guestToken }] }, maximum 100. Every pair is verified. Invalid pairs disclose no request; database errors return an error. Response includes a safe request summary list, latest 12 notices and the total unread count for the verified requests.
- POST /contacts/:id/guest-notification/read: X-Support-Token header and body { notificationId }. Requires a verified guest capability and an exact notification version.
- guest-support-subscribe: verified request/token pairs, maximum 100. Room names are derived by the server: support:guest:<requestId>. The client cannot choose a room, account or role. Subscribe/unsubscribe operations are serialized to prevent a late validation from leaving a finished session subscribed.
- guest-support-notification and guest-support-changed travel only to the guest request's room. Support chat keeps its separate support:request:<requestId> room and existing access checks.
- Credentials are never put in route URLs, notification payloads, request summaries or application logs.

## Scope

Email recovery is implemented below. Web Push and live notifications with the browser closed are not implemented. Closing a tab normally clears sessionStorage, although browser session restoration and duplicating a tab can preserve/copy it. Separate browser profiles or a normal window plus incognito are suitable for testing independent people. Two people using the same open tab share its guest session until it is ended. No verified identity is inferred from the submitted email/phone.

## Manual check

1. Sign in as admin in a normal window. In an incognito window, submit request A without signing in and keep the tab open.
2. Send a reply and change A's status as admin. The guest bell should update, sound when the browser permits it, and open A with the admin's avatar in the notification.
3. Open another independent browser profile and submit B. Updates to A must never reach B.
4. Temporarily disconnect the guest, update A as admin, then reconnect. The guest should recover the latest unread notice and chat messages.
5. Reload the guest tab: access remains. End the guest session: the bell and conversation disappear, while A remains in admin management. Opening only A's ID in a clean profile must not reveal the conversation.

## Email recovery

- Find my requests on the guest request page sends a link to the submitted email through the existing mailTransporter (Gmail API). The email uses the selected website language: vi or en; other values default to en. No issue description, message history, request ID or unverified contact name is included in the email.
- Existing EMAIL_USERNAME / GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN configuration is reused. CLIENT_SITE_URL must be the deployed frontend origin. No new email credential is required. Delivery is tested with a mocked provider; verify delivery in the configured environment.
- POST /contacts/guest-recovery accepts { email, language }. Valid emails receive the same 202 response whether or not guest requests exist, are throttled, or delivery fails. Invalid addresses receive 400. Rate-counter/configuration failures receive 503. Mailbox lookup and delivery run after the generic response, so provider latency cannot reveal mailbox existence. Background delivery failures log only a fixed message and permit retry; no durable email queue is introduced. Server limits use atomic, HMAC-keyed Mongo counters: 20 attempts/IP/hour and 5/email/hour, with an in-bucket one-minute email cooldown; the form also enforces a one-minute resend wait. No raw email/IP is stored in the counters.
- The link points to /support-requests/recover?language=vi#token=<random value>. Only the SHA-256 hash of this random token is stored. Link lifetime is 15 minutes. The fragment is removed from browser history on landing. A pending token is kept in sessionStorage with the server-reported expiry, allowing refresh without consuming the link. Confirmation, invalidation, expiry or ending the guest session clears it. Restricted storage still permits the current page to use the original link. Tokens are never printed to application logs.
- POST /contacts/guest-recovery/inspect validates { token } without consuming it or exposing email/request data. Automated email link opening does not grant access.
- POST /contacts/guest-recovery/confirm requires an explicit website button click. An atomic unused-and-unexpired compare-and-set permits one successful confirmation. A provisional grant is removed if another tab wins or the claim fails.
- Successful confirmation creates a separate random guest session token, storing only its hash, the latest 100 guest request IDs matching the verified email (case insensitive), and a 24-hour expiry. Existing per-request guest tokens and active conversations are unchanged. Account-owned patient/doctor/admin requests are never included. This verifies access to the contact mailbox, not a person's identity or the accuracy of the original submission.
- The frontend saves restored request/token pairs in sessionStorage, returns to My support requests and reuses existing notifications and ContentChat. Restored credential entries retain their expiry; expired or server-rejected grants are removed with an explicit email-recovery prompt. Existing chat history/statuses are loaded from MongoDB; missed live alerts are not replayed as sound. A signed-in account is not replaced: the confirmation page asks the user to open the email link privately or sign out first.
- getSupportAccess checks that each recovered request is in the session and has not expired, regardless of delayed Mongo TTL cleanup. Socket room memberships expire with that session. Ending the guest session still clears credentials in the current tab; it does not revoke copies held elsewhere.

To test next-day recovery: submit as guest, close/clear the tab, have admin reply while guest is offline, open My support requests in a fresh window and request a link. Open the email link, confirm once, and verify the old history/unread state. Reusing the link or using it after 15 minutes must show the resend form. Check both Vietnamese and English emails.

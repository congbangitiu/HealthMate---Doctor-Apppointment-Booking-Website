# Reusing ContentChat for support requests

The request page renders SupportChat, which manages authenticated support data and passes it directly to the existing ContentChat component through its support prop. There is no separate ChatView or cloned support chat UI.

ContentChat owns the same header, message list/bubbles, composer and emoji picker for both uses. Its normal props still select the original patient/doctor conversation flow. The optional support prop provides actual support messages/viewer data, controlled draft, loading/error state, pagination and send/retry callbacks. It does not fake doctor/user identities.

SupportChat retains its HTTP message writes, request-specific socket subscription, nonce retry, cursor catch-up and exact-notification read logic. ContentChat delegates support submissions to onSend and draft updates to onDraftChange; support never invokes the legacy send-message/edit-message/remove-message events or chat APIs. Attachments, edit/delete menus and call actions remain available only in the original conversation flow. Emoji remains text in either flow.

ContentChat.module.scss and its local _composer.scss style both uses. Support has only an embedded layout modifier for width and bounded message scrolling. The replaced ChatView component and SupportChat stylesheet were removed.

Regression tests cover both patient/doctor sending, Enter behavior, local/server deletion, editing/cancel, owner-only actions, media, uploads, emoji, mobile back, scroll cleanup, and support callback isolation. Existing support tests cover token/guest headers, retry nonces, reconnect, read state and the request page.

The support header uses the current assigned admin name and avatar returned by the authorized conversation endpoint. Only id, fullname and photo are exposed. Assignment/release events refresh the header through the existing support-chat-changed subscription. Unassigned requests show the support-team label and headset icon; failed or missing photos keep the assigned name with a neutral icon.

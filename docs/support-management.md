# Admin support management

Open `/admins/management/support` using an admin account. The sidebar tab is **Support requests / Yêu cầu hỗ trợ**.

- Search by sender name, email, custom subject or full request ID.
- Filter by status and submission date. Calendar dates use Vietnam time (UTC+7), including the entire end date.
- Results are paginated on the server, newest first, ten per page.
- Open a request to view contact information and its full message. Read state belongs to each admin separately and does not resolve the request.
- Assign an unassigned request to yourself, or release your own assignment.
- Save status changes and internal notes (up to 2,000 characters). The processing history records the actor and timestamp.
- Updates compare the request version atomically. On conflict, reload details and review the latest status before saving again; the draft note remains.
- Notes and processing history are only exposed through admin-protected endpoints.

Deep link: `/admins/management/support?request=<request-id>`

API (all routes below require authentication and a database-confirmed admin role):

- GET /api/v1/contacts?q=&status=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=10
- GET /api/v1/contacts/:id
- POST /api/v1/contacts/:id/read
- PATCH /api/v1/contacts/:id with `{ version, status?, note?, assignment?: "claim" | "release" }`

Public Contact submission remains POST /api/v1/contacts, protected by reCAPTCHA.
Existing support requests are compatible; the new fields receive defaults and need no data migration.

Admin bell notifications and support conversation are implemented; see support-realtime.md. Signed-in patient and doctor senders also receive bell notifications for status changes and admin replies. Guest notifications remain a separate step.

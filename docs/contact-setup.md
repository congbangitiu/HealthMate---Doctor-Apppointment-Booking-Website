# Contact form (step 1)

Set these values in your local/deployment environment, then restart both services:

- Frontend, `front-end/.env`: `VITE_RECAPTCHA_SITE_KEY=<your v2 checkbox site key>`
- Backend, `back-end/.env`: `RECAPTCHA_SECRET_KEY=<matching secret key>`
- Backend, recommended: `RECAPTCHA_ALLOWED_HOSTNAMES=localhost,your-domain.example`

Register a reCAPTCHA **v2 checkbox** key and allow the frontend domains in Google's admin console.
Never put the secret key in a VITE variable or commit it.
Existing JWT_SECRET_KEY and MONGO_URL must also be configured.
Google documentation: https://developers.google.com/recaptcha/docs/display and https://developers.google.com/recaptcha/docs/verify

The form is disabled without a site key. The API refuses requests without the server secret; there is no CAPTCHA bypass.
POST /api/v1/contacts accepts fullname, email, phone, category, subject (only for other), message and captchaToken.
A valid optional Bearer token links the submission to the authenticated account; edited contact details never update that account.
Phone numbers are stored as strings to preserve leading zeroes.

At most five saved submissions per server-observed IP are accepted within ten minutes.
IP values are HMAC-hashed before storage. Deployments behind a proxy must configure Express trust proxy for the actual trusted proxy topology; do not blindly trust forwarded headers.
The limiter is a basic database count and may allow extra concurrent submissions; it complements CAPTCHA.
Existing profile phone fields are numeric: leading zeroes already lost there cannot be restored reliably by the form.

Admin request management is available at /admins/management/support; see support-management.md. In-site admin notifications and support chat are available; see support-realtime.md.

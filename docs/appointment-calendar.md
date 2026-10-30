# Appointment calendar

## Open the feature

- Patient: `/users/profile/me`.
- Doctor: `/doctors/profile/me?tab=appointments`.
- Profiles open the **original List interface** by default: the existing doctor table and patient appointment cards, including their original filters, pagination and actions.
- Use **List / Calendar** to switch. Calendar offers **Day / Week**, with no second replacement list inside it. Returning to List remounts the original screen and fetches fresh data, including changes made in Calendar.
- `appointmentView=list|calendar` persists the choice in the URL. Previous shared links with `calView=day|week` still open Calendar, unless explicitly overridden by `appointmentView=list`.
- Day/week use clinic dates in Vietnam (UTC+7), even on devices in another timezone. Weeks start on Monday. On screens up to 768px, day/week display a daily agenda.
- Calendar filters use doctor IDs for patients and patient IDs for doctors. Identical names remain separate options. The original List retains its existing filter behavior.
- Date, view, person, status and ordering are stored as `calDate`, `calView`, `calPerson`, `calStatus`, `calOrder` query parameters. Existing query parameters, including the doctor profile tab, are preserved.
- Copying the calendar link shares the view/filter settings. The API still scopes data to the signed-in user; it does not share access to another person's appointments.

## Details and actions

Select an appointment to open a side panel with contact information, payment status, links to the existing medical-record screen and change history. The panel supports Escape, focus trapping and returning focus to the triggering appointment.

Patients retain cancellation in the original List. Calendar also provides cancellation, with explicit confirmation and an in-place refresh instead of a full-page reload.

Doctors can reschedule their own future **pending** appointments. Drag an appointment onto a marked available slot, or open its details and choose **Reschedule**. Both routes open the same confirmation form and require a reason. The destination must have the same duration, exist in that doctor's availability, and not overlap an active appointment for the doctor or patient.

Follow-up appointments cannot be rescheduled in this release: their parent appointment/PDF documents refer to the original schedule. A later document reissue workflow is needed before enabling that operation.

Every successful reschedule records the old/new slots, authenticated actor ID/name, reason and timestamp. New status changes record their actor too. Historical entries without actor information display an explicit fallback; actor names are not inferred retroactively.

## Backend and deployment

New endpoints:

| Endpoint                                     | Permission    | Purpose                                            |
| -------------------------------------------- | ------------- | -------------------------------------------------- |
| `GET /api/v1/bookings/calendar/availability` | Doctor        | Future slots excluding overlapping active bookings |
| `PUT /api/v1/bookings/:id/reschedule`        | Owning doctor | Transactional schedule change                      |

Reschedule request:

```json
{
    "timeSlot": { "day": "2026-11-02", "startingTime": "09:00", "endingTime": "09:30" },
    "expectedVersion": 0,
    "reason": "Patient requested a later time"
}
```

**MongoDB Atlas or a replica set is required for rescheduling.** The operation claims the destination slot, updates the booking/version/history and returns the old slot within one transaction. Standalone MongoDB returns HTTP 503 with `TRANSACTIONS_REQUIRED`; calendar viewing is still available. No fallback performs partial writes.

Existing bookings need no migration. Missing `scheduleVersion` is treated as zero and new history arrays default to empty. A stale version or unavailable destination returns HTTP 409. After any failed save, the client refetches and asks the user to review/reopen the edit instead of blindly retrying.

Calendar socket subscriptions verify the JWT and derive their own `calendar:doctor:<id>` or `calendar:patient:<id>` room. The room cannot be chosen by supplying another person's ID. Invalidation targets both participants, carries no patient details, and triggers an authenticated refetch. Reconnect, visibility/focus and a 60-second visible-page refresh recover missed events. Unmount removes listeners and the subscription. Older notification/chat rooms retain their existing behavior.

## Implementation and scope

- `AppointmentCalendar` is shared by the two profile entry components. It owns URL state, details and confirmation actions.
- Calendar filters reuse the existing `Selections` component and its React Select styles. Optional `hideSchedule` and `fitContainer` props adapt it to the calendar; the original List keeps its default layout. Person filter values remain IDs stored on the URL.
- `CalendarGrid` positions overlapping appointments in separate columns and renders actual available slots for doctors.
- `useAppointmentSchedule` owns authenticated requests, abort/cleanup and realtime recovery. Old responses cannot overwrite newer requests.
- Date arithmetic uses UTC calendar fields; appointment instants explicitly use `+07:00`.
- Existing React/Vite/JavaScript, MUI, Socket.IO and Vitest dependencies are reused. This change does not introduce a framework migration or new packages.
- This is a personal calendar, not a receptionist workspace with access to every doctor's patients. Patient schedules may include multiple doctors, with an ID-based filter.
- Data fetching retains the existing all-own-appointments endpoints; filtering and date-range rendering happen on the client. At larger scale, add server-side range queries/pagination before introducing more client caching.
- The reschedule transaction protects the new operation; legacy create/cancel/slot-maintenance paths have not been converted to one shared transactional booking engine. Concurrent combinations of those old paths need database integration/load tests and a shared reservation protocol before claiming global no-double-booking guarantees.

## Verification

After a successful reschedule transaction, `reschedule-notification` updates the patient's existing notification bell with the original and new time. Schedule history stores a separate `patientUnread` flag, so this does not alter the doctor's booking unread state. `GET /bookings/calendar/notifications` restores the latest six changes and the unread count on reload/reconnect; `POST /bookings/calendar/notifications/read` marks only the authenticated patient's changes through the last displayed timestamp as read. Both API routes are patient-only. Restart the backend after updating these routes. HTTP and Socket.IO must point to the same backend.

```sh
npm --prefix front-end test
npm --prefix back-end test
npm --prefix front-end run build
```

New tests cover clinic dates, event overlap layout, URL/ID filters, keyboard-accessible actions, patient/doctor controls, drag confirmation, stale writes, realtime refresh/cleanup, cancellation and mobile rendering. Backend tests cover role/ownership, elapsed/invalid slots, version checks, overlapping bookings, transaction options/failure handling and authenticated socket rooms.

Controller tests mock database operations; they are not live replica-set transaction/concurrency tests. Run a database integration smoke test against a nonproduction replica set before deployment.

Optional browser fixture: run Vite on port 5174 and open `/test/browser/calendar-preview.html?role=doctor` or `?role=patient&integrated`. All data is synthetic; the fixture is outside the application router and production build entry. It supports inspecting the real profile layouts without a database or login.

`front-end/test/browser/check-calendar.mjs <output-directory>` additionally checks a dedicated headless Chromium CDP endpoint on port 9333. It verifies seven-column rendering, mobile agenda, profile overflow and uncaught exceptions, and captures screenshots. It uses Node built-ins and does not install browser packages.

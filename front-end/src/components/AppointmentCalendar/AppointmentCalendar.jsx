import { forwardRef, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Slide, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { FiCalendar, FiCheck, FiChevronLeft, FiChevronRight, FiCopy, FiRefreshCw, FiX } from 'react-icons/fi';
import useAppointmentSchedule from './useAppointmentSchedule';
import CalendarGrid from './CalendarGrid';
import Selections from '../Selections/Selections';
import Select from 'react-select';
import { getSelectionStyles } from '../Selections/selectStyles';
import ConfirmCancel from '../../Dashboard/user-account/ConfirmCancel/ConfirmCancel';
import { MdOutlineDone, MdOutlinePendingActions } from 'react-icons/md';
import { addDays, clinicToday, entityId, isFutureSlot, minutes, slotKey, validDay, visibleDays } from './calendarUtils';
import styles from './AppointmentCalendar.module.scss';

const PAGE_SIZE = 15;
const CancelTransition = forwardRef((props, ref) => {
    return <Slide direction="up" ref={ref} {...props} />;
});
CancelTransition.displayName = 'CancelTransition';

const AppointmentCalendar = ({ role, calendarOnly = false }) => {
    const { t, i18n } = useTranslation('calendar');
    const mobile = useMediaQuery('(max-width: 768px)');
    const [params, setParams] = useSearchParams();
    const views = calendarOnly ? ['day', 'week'] : ['day', 'week', 'list'];
    const view = views.includes(params.get('calView')) ? params.get('calView') : 'week';
    const day = validDay(params.get('calDate')) ? params.get('calDate') : clinicToday();
    const status = ['pending', 'done', 'cancelled'].includes(params.get('calStatus')) ? params.get('calStatus') : 'all';
    const personFilter = params.get('calPerson') || 'all';
    const order = params.get('calOrder') === 'oldest' ? 'oldest' : 'newest';
    const { appointments, slots, loading, refreshing, error, slotError, refresh, request } =
        useAppointmentSchedule(role);
    const [selectedId, setSelectedId] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [change, setChange] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [reason, setReason] = useState('');
    const [target, setTarget] = useState('');
    const [busy, setBusy] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [notice, setNotice] = useState('');
    const [copied, setCopied] = useState(false);
    const [copying, setCopying] = useState(false);
    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [copied]);
    const [limit, setLimit] = useState(PAGE_SIZE);
    const locale = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-GB';
    const personField = role === 'doctor' ? 'user' : 'doctor';
    const selected = appointments.find((item) => item._id === selectedId);
    const StatusIcon = { pending: MdOutlinePendingActions, done: MdOutlineDone, cancelled: FiX }[selected?.status];
    const days = useMemo(() => visibleDays(day, view === 'day' ? 'day' : 'week'), [day, view]);
    const updateParams = (updates) =>
        setParams((current) => {
            const next = new URLSearchParams(current);
            for (const [key, value] of Object.entries(updates)) value == null ? next.delete(key) : next.set(key, value);
            return next;
        });
    const people = useMemo(
        () =>
            [
                ...new Map(
                    appointments
                        .filter((item) => item[personField]?._id)
                        .map((item) => [entityId(item[personField]), item[personField]]),
                ).values(),
            ].sort((a, b) => a.fullname.localeCompare(b.fullname)),
        [appointments, personField],
    );
    const personOptions = [
        {
            value: 'all',
            label: t(role === 'doctor' ? 'appointmentsDoctor:filters.allPatients' : 'myBookings:filters.allDoctors'),
        },
        ...people.map((person) => ({
            value: entityId(person),
            label: role === 'patient' ? `${t('myBookings:prefix')} ${person.fullname}` : person.fullname,
        })),
    ];
    const statusOptions = ['all', 'pending', 'done', 'cancelled'].map((value) => ({
        value,
        label: t(value === 'all' ? 'allStatuses' : value),
    }));
    const selectPerson = (option) =>
        updateParams({ calPerson: !option || option.value === 'all' ? null : option.value });
    const filtered = useMemo(
        () =>
            appointments
                .filter(
                    (item) =>
                        validDay(item.timeSlot?.day) &&
                        (status === 'all' || item.status === status) &&
                        (personFilter === 'all' || entityId(item[personField]) === personFilter) &&
                        (view === 'list' || days.includes(item.timeSlot.day)),
                )
                .sort(
                    (a, b) =>
                        `${a.timeSlot.day}${a.timeSlot.startingTime}`.localeCompare(
                            `${b.timeSlot.day}${b.timeSlot.startingTime}`,
                        ) * (view === 'list' && order === 'newest' ? -1 : 1),
                ),
        [appointments, status, personFilter, personField, view, days, order],
    );
    useEffect(() => {
        setLimit(PAGE_SIZE);
    }, [status, personFilter, view, day, order]);
    useEffect(() => {
        if (!loading && !error && selectedId && !selected) {
            setSelectedId(null);
            setChange(null);
            setCancelling(false);
        }
    }, [selectedId, selected, loading, error]);

    const formatDay = (value, compact = false) =>
        new Intl.DateTimeFormat(locale, {
            timeZone: 'UTC',
            weekday: compact ? 'short' : undefined,
            day: '2-digit',
            month: '2-digit',
            year: compact ? undefined : 'numeric',
        }).format(new Date(`${value}T00:00:00Z`));
    const formatSlot = (slot) =>
        slot ? `${formatDay(slot.day)} · ${slot.startingTime}–${slot.endingTime}` : t('unknown');
    const formatTimestamp = (value) =>
        value && Number.isFinite(new Date(value).getTime())
            ? new Intl.DateTimeFormat(locale, {
                  timeZone: 'Asia/Ho_Chi_Minh',
                  dateStyle: 'short',
                  timeStyle: 'short',
              }).format(new Date(value))
            : '';
    const editable = (appointment) =>
        role === 'doctor' &&
        appointment?.status === 'pending' &&
        !appointment.isReExamination &&
        isFutureSlot(appointment.timeSlot);
    const candidateSlots = change
        ? slots
              .filter(
                  (slot) =>
                      isFutureSlot(slot) &&
                      minutes(slot.endingTime) - minutes(slot.startingTime) ===
                          minutes(change.timeSlot.endingTime) - minutes(change.timeSlot.startingTime),
              )
              .sort((a, b) => slotKey(a).localeCompare(slotKey(b)))
        : [];

    const openChange = (appointment, slot) => {
        if (!editable(appointment) || busy) return;
        setSelectedId(slot ? null : appointment._id);
        // Snapshot the version at edit start. Realtime updates must not silently replace it.
        setChange(appointment);
        setTarget(slot ? slotKey(slot) : '');
        setReason('');
        setSaveError('');
        setNotice('');
    };
    const handleDrop = (id, slot) => {
        const appointment = appointments.find((item) => item._id === id);
        if (
            !editable(appointment) ||
            minutes(slot.endingTime) - minutes(slot.startingTime) !==
                minutes(appointment.timeSlot.endingTime) - minutes(appointment.timeSlot.startingTime)
        ) {
            setNotice(t('invalidDrop'));
            return;
        }
        openChange(appointment, slot);
    };
    const submitChange = async (event) => {
        event.preventDefault();
        const chosen = candidateSlots.find((slot) => slotKey(slot) === target);
        if (!chosen || !reason.trim() || busy || saveError) return;
        setBusy(true);
        try {
            await request(`/bookings/${change._id}/reschedule`, {
                method: 'PUT',
                body: JSON.stringify({
                    timeSlot: { day: chosen.day, startingTime: chosen.startingTime, endingTime: chosen.endingTime },
                    expectedVersion: change.scheduleVersion || 0,
                    reason: reason.trim(),
                }),
            });
            setChange(null);
            setNotice(t('saved'));
            updateParams({ calDate: chosen.day });
        } catch (failure) {
            setSaveError(t(`errors.${failure.code || 'SAVE_FAILED'}`, { defaultValue: t('errors.SAVE_FAILED') }));
        } finally {
            setBusy(false);
            refresh();
        }
    };
    const cancelBooking = async () => {
        await request(`/bookings/${selectedId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'cancelled' }),
        });
        setNotice(t('cancelledSuccess'));
        refresh();
    };
    const share = async () => {
        if (copying) return;
        setCopying(true);
        setCopied(false);
        setNotice('');
        // Include defaults so a shared "today" view does not drift tomorrow.
        const shared = new URLSearchParams(params);
        shared.set('calView', view);
        shared.set('calDate', day);
        updateParams({ calView: view, calDate: day });
        const url = new URL(window.location.href);
        url.search = shared.toString();
        try {
            await navigator.clipboard.writeText(url.toString());
            setCopied(true);
        } catch {
            setNotice(t('copyError'));
        } finally {
            setCopying(false);
        }
    };
    const history = selected
        ? [
              { key: 'created', timestamp: selected.createdAt, label: t('created') },
              ...(selected.statusHistory || []).map((item, index) => ({
                  key: `status-${index}`,
                  timestamp: item.timestamp,
                  label: t('statusChanged', { status: t(item.status) }),
                  actor: item.actorName || t('legacyActor'),
              })),
              ...(selected.scheduleHistory || []).map((item, index) => ({
                  key: `schedule-${index}`,
                  timestamp: item.timestamp,
                  label: `${formatSlot(item.from)} → ${formatSlot(item.to)}`,
                  actor: t('changedBy', { name: item.actorName || t('unknown') }),
                  reason: item.reason,
              })),
          ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        : [];

    const agenda = (items) => (
        <div className={styles.agenda}>
            {items.map((appointment, index) => {
                const previous = items[index - 1];
                const person = appointment[personField];
                return (
                    <div key={appointment._id}>
                        {previous?.timeSlot.day !== appointment.timeSlot.day && (
                            <h3 className={styles.agendaDay}>{formatDay(appointment.timeSlot.day, true)}</h3>
                        )}
                        <button className={styles.agendaItem} onClick={() => setSelectedId(appointment._id)}>
                            <span className={styles.agendaTime}>
                                {appointment.timeSlot.startingTime}
                                <small>{appointment.timeSlot.endingTime}</small>
                            </span>
                            <span className={styles.agendaPerson}>
                                <strong>{person?.fullname || t('unknown')}</strong>
                                {appointment.isReExamination && <small>{t('followUp')}</small>}
                            </span>
                            <span className={`${styles.badge} ${styles[appointment.status] || ''}`}>
                                {t(appointment.status)}
                            </span>
                            <span aria-hidden="true">›</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );

    return (
        <section className={styles.workspace} aria-label={t('title')} aria-busy={loading || refreshing}>
            <header className={styles.heading}>
                <div className={styles.headingMeta}>
                    <p>{t('timezone')}</p>
                    <div className={styles.headingActions}>
                        <button
                            type="button"
                            title={t(copied ? 'copied' : 'share')}
                            aria-label={t(copied ? 'copied' : 'share')}
                            disabled={copying}
                            onClick={share}
                        >
                            {copied ? (
                                <FiCheck aria-hidden="true" className={styles.copySuccess} />
                            ) : (
                                <FiCopy aria-hidden="true" />
                            )}
                        </button>
                        <button
                            type="button"
                            title={t('refresh')}
                            disabled={refreshing || loading}
                            onClick={refresh}
                            aria-label={t('refresh')}
                        >
                            <FiRefreshCw
                                aria-hidden="true"
                                className={loading || refreshing ? styles.refreshSpinning : undefined}
                            />
                        </button>
                    </div>
                </div>
            </header>
            <div className={styles.toolbar}>
                <div className={styles.navigation}>
                    {view !== 'list' && (
                        <>
                            <button
                                onClick={() => updateParams({ calDate: addDays(day, view === 'day' ? -1 : -7) })}
                                aria-label={t('previous')}
                            >
                                <FiChevronLeft />
                            </button>
                            <button onClick={() => updateParams({ calDate: clinicToday() })}>{t('today')}</button>
                            <button
                                onClick={() => updateParams({ calDate: addDays(day, view === 'day' ? 1 : 7) })}
                                aria-label={t('next')}
                            >
                                <FiChevronRight />
                            </button>
                            <label>
                                <span className={styles.srOnly}>{t('date')}</span>
                                <input
                                    aria-label={t('date')}
                                    type="date"
                                    value={day}
                                    min="1900-01-01"
                                    max="9998-12-31"
                                    onChange={(event) => {
                                        if (validDay(event.target.value)) updateParams({ calDate: event.target.value });
                                    }}
                                />
                            </label>
                        </>
                    )}
                </div>
                <div className={styles.segmented} role="group" aria-label={t('title')}>
                    {views.map((mode) => (
                        <button key={mode} aria-pressed={view === mode} onClick={() => updateParams({ calView: mode })}>
                            {t(mode)}
                        </button>
                    ))}
                </div>
            </div>
            <div className={styles.filterBar}>
                <div className={styles.filters}>
                    <Selections
                        fitContainer
                        hideSchedule={view !== 'list'}
                        {...(role === 'doctor'
                            ? {
                                  patientsOptions: personOptions,
                                  selectedPatient:
                                      personOptions.find((option) => option.value === personFilter) || null,
                                  setSelectedPatient: selectPerson,
                                  hideDoctor: true,
                              }
                            : {
                                  doctorsOptions: personOptions,
                                  selectedDoctor: personOptions.find((option) => option.value === personFilter) || null,
                                  setSelectedDoctor: selectPerson,
                                  hidePatient: true,
                              })}
                        selectedAppointmentStatus={statusOptions.find((option) => option.value === status)}
                        setSelectedAppointmentStatus={(option) =>
                            updateParams({ calStatus: !option || option.value === 'all' ? null : option.value })
                        }
                        appointmentsStatusOptions={statusOptions}
                        selectedSchedule={{ value: order, label: t(`selections:scheduleOptions.${order}`) }}
                        setSelectedSchedule={(option) => updateParams({ calOrder: option?.value || null })}
                    />
                </div>
                <div className={styles.filterSummary}>
                    <button
                        className={styles.clearFilters}
                        onClick={() => updateParams({ calPerson: null, calStatus: null, calOrder: null })}
                    >
                        {t('clear')}
                    </button>
                </div>
                <span className={styles.count}>{t('count', { count: filtered.length })}</span>
            </div>
            {notice && (
                <div aria-live="polite" className={styles.notice}>
                    {notice}
                </div>
            )}
            {slotError && (
                <p role="alert" className={styles.error}>
                    {t('errors.LOAD_FAILED')}
                </p>
            )}
            {error && (
                <div role="alert" className={`${styles.error} ${styles.loadError}`}>
                    <span>{t('loadError')}</span>
                    <button onClick={refresh}>{t('retry')}</button>
                </div>
            )}
            {loading ? (
                <div role="status" className={styles.empty}>
                    {t('loading')}
                </div>
            ) : (
                <>
                    {!filtered.length && (
                        <div className={styles.empty}>
                            <FiCalendar aria-hidden="true" />
                            <strong>{t('empty')}</strong>
                            <p>{t('emptyHint')}</p>
                        </div>
                    )}
                    {view === 'list' || mobile ? (
                        <>
                            {agenda(filtered.slice(0, limit))}
                            {filtered.length > limit && (
                                <button className={styles.more} onClick={() => setLimit((value) => value + PAGE_SIZE)}>
                                    {t('more')}
                                </button>
                            )}
                        </>
                    ) : (
                        <CalendarGrid
                            days={days}
                            appointments={filtered}
                            scheduleAppointments={appointments}
                            showCancelledHistory={status === 'cancelled'}
                            slots={slots}
                            role={role}
                            formatDay={formatDay}
                            formatTimestamp={formatTimestamp}
                            t={t}
                            onOpen={setSelectedId}
                            onDrop={handleDrop}
                            onDrag={setDragging}
                            dragging={dragging}
                            busy={busy}
                        />
                    )}
                </>
            )}
            <footer className={styles.legend}>
                {['pending', 'done', 'cancelled'].map((value) => (
                    <span key={value}>
                        <i className={styles[value]} />
                        {t(value)}
                    </span>
                ))}
                {role === 'doctor' && (
                    <span>
                        <i className={styles.availableLegend} />
                        {t('available')}
                    </span>
                )}
            </footer>
            <div className={styles.calendarHelp}>
                <p className={styles.hint}>{t(role === 'doctor' ? 'dragHint' : 'patientHint')}</p>
                {mobile && view !== 'list' && <p className={styles.srOnly}>{t('mobileHint')}</p>}
            </div>

            <Drawer
                anchor="right"
                open={Boolean(selected)}
                onClose={() => {
                    if (!busy && !change && !cancelling) setSelectedId(null);
                }}
                PaperProps={{ className: styles.drawer }}
            >
                {selected && (
                    <div
                        className={styles.detail}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="appointment-detail-title"
                    >
                        <header>
                            <h2 id="appointment-detail-title">{t('details')}</h2>
                            <button
                                className={styles.detailClose}
                                autoFocus
                                onClick={() => setSelectedId(null)}
                                disabled={busy}
                                aria-label={t('close')}
                            >
                                <FiX />
                            </button>
                        </header>
                        <div className={styles.detailPerson}>
                            <h3>{selected[personField]?.fullname || t('unknown')}</h3>
                            <span className={`${styles.detailStatus} ${styles[selected.status]}`}>
                                {StatusIcon && <StatusIcon aria-hidden="true" />}
                                {t(selected.status)}
                            </span>
                        </div>
                        <p className={styles.detailTime}>
                            <FiCalendar aria-hidden="true" />
                            {selected.timeSlot ? (
                                <>
                                    <span>{formatDay(selected.timeSlot.day)}</span>
                                    <span className={styles.detailTimeSeparator}>|</span>
                                    <span>
                                        {selected.timeSlot.startingTime}–{selected.timeSlot.endingTime}
                                    </span>
                                </>
                            ) : (
                                t('unknown')
                            )}
                        </p>
                        {selected.isReExamination && <p>{t('followUp')}</p>}
                        <dl>
                            <div>
                                <dt>{t('phone')}</dt>
                                <dd>{selected[personField]?.phone || '—'}</dd>
                            </div>
                            <div>
                                <dt>{t('email')}</dt>
                                <dd>{selected[personField]?.email || '—'}</dd>
                            </div>
                            <div>
                                <dt>{t('payment')}</dt>
                                <dd>{t(selected.isPaid ? 'paid' : 'unpaid')}</dd>
                            </div>
                        </dl>
                        <div className={styles.detailActions}>
                            {selected.status !== 'cancelled' && (
                                <Link
                                    to={`/${role === 'doctor' ? 'doctors' : 'users'}/appointments/my-appointments/${
                                        selected._id
                                    }`}
                                >
                                    {t('records')}
                                </Link>
                            )}
                            {editable(selected) && (
                                <button
                                    className={styles.primaryAction}
                                    onClick={() => openChange(selected)}
                                    disabled={busy || Boolean(slotError)}
                                >
                                    {t('reschedule')}
                                </button>
                            )}
                            {role === 'patient' && selected.status === 'pending' && (
                                <button
                                    className={styles.danger}
                                    onClick={() => {
                                        setSaveError('');
                                        setCancelling(true);
                                    }}
                                >
                                    {t('cancelBooking')}
                                </button>
                            )}
                        </div>
                        {editable(selected) && <p className={styles.hint}>{t('editHint')}</p>}
                        <h3 className={styles.historyTitle}>{t('history')}</h3>
                        <ol className={styles.history}>
                            {history.map((entry) => (
                                <li key={entry.key}>
                                    <time>{formatTimestamp(entry.timestamp)}</time>
                                    <p>{entry.label}</p>
                                    {entry.actor && <small>{entry.actor}</small>}
                                    {entry.reason && (
                                        <p className={styles.historyReason}>
                                            {t('historyReason', { reason: entry.reason })}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </Drawer>
            <Dialog
                open={Boolean(change)}
                onClose={() => {
                    if (!busy) setChange(null);
                }}
                fullWidth
                maxWidth="sm"
                aria-labelledby="reschedule-title"
                TransitionComponent={CancelTransition}
                PaperProps={{ className: styles.changePaper }}
            >
                <form onSubmit={submitChange} className={styles.changeForm}>
                    <div className={styles.changeHeader}>
                        <DialogTitle id="reschedule-title" className={styles.changeTitle}>
                            {t('rescheduleTitle')}
                        </DialogTitle>
                        <button
                            type="button"
                            className={styles.changeClose}
                            aria-label={t('close')}
                            disabled={busy}
                            onClick={() => setChange(null)}
                        >
                            <FiX aria-hidden="true" />
                        </button>
                    </div>
                    <DialogContent className={styles.changeContent}>
                        <p className={styles.currentTime}>
                            <strong>{t('from')}:</strong>
                            {change && (
                                <span>
                                    {formatDay(change.timeSlot.day)}
                                    <span className={styles.detailTimeSeparator}> | </span>
                                    {change.timeSlot.startingTime}–{change.timeSlot.endingTime}
                                </span>
                            )}
                        </p>
                        <div className={styles.changeField}>
                            <label htmlFor="reschedule-slot">{t('chooseSlot')}</label>
                            <Select
                                inputId="reschedule-slot"
                                instanceId="reschedule-slot"
                                styles={getSelectionStyles()}
                                options={candidateSlots.map((slot) => ({
                                    value: slotKey(slot),
                                    label: formatSlot(slot),
                                }))}
                                value={
                                    candidateSlots
                                        .filter((slot) => slotKey(slot) === target)
                                        .map((slot) => ({ value: slotKey(slot), label: formatSlot(slot) }))[0] || null
                                }
                                onChange={(option) => setTarget(option?.value || '')}
                                placeholder={t('chooseSlot')}
                                noOptionsMessage={() => t('noSlots')}
                                menuPlacement="auto"
                                maxMenuHeight={180}
                                required
                                autoFocus
                                isDisabled={busy}
                            />
                        </div>
                        {!candidateSlots.length && <p className={styles.hint}>{t('noSlots')}</p>}
                        <div className={styles.changeField}>
                            <label htmlFor="reschedule-reason">{t('reason')}</label>
                            <textarea
                                id="reschedule-reason"
                                required
                                maxLength={500}
                                value={reason}
                                disabled={busy}
                                placeholder={t('reasonPlaceholder')}
                                onChange={(event) => setReason(event.target.value)}
                            />
                        </div>
                        {saveError && (
                            <p role="alert" className={styles.error}>
                                {saveError}
                            </p>
                        )}
                    </DialogContent>
                    <DialogActions className={styles.changeActions}>
                        <button type="button" disabled={busy} onClick={() => setChange(null)}>
                            {t('back')}
                        </button>
                        <button
                            type="submit"
                            disabled={
                                busy ||
                                Boolean(saveError) ||
                                !reason.trim() ||
                                !candidateSlots.some((slot) => slotKey(slot) === target)
                            }
                        >
                            {t(busy ? 'saving' : 'confirm')}
                        </button>
                    </DialogActions>
                </form>
            </Dialog>
            <Dialog
                open={cancelling && Boolean(selected)}
                TransitionComponent={CancelTransition}
                onClose={() => setCancelling(false)}
                slotProps={{ paper: { 'aria-label': t('myBookings:confirmCancel.title') } }}
                sx={{ '& .MuiPaper-root': { borderRadius: '10px' } }}
            >
                {selected && (
                    <ConfirmCancel
                        setShowConfirmCancel={setCancelling}
                        appointment={selected}
                        onConfirm={cancelBooking}
                    />
                )}
            </Dialog>
        </section>
    );
};
AppointmentCalendar.propTypes = {
    role: PropTypes.oneOf(['doctor', 'patient']).isRequired,
    calendarOnly: PropTypes.bool,
};

export default AppointmentCalendar;

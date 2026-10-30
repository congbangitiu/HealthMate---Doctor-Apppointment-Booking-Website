import PropTypes from 'prop-types';
import { useState } from 'react';
import { Drawer } from '@mui/material';
import { FiX, FiXCircle } from 'react-icons/fi';
import { clock, isFutureSlot, layoutEvents, minutes, slotKey } from './calendarUtils';
import styles from './AppointmentCalendar.module.scss';

const CalendarGrid = ({
    days,
    appointments,
    scheduleAppointments = appointments,
    showCancelledHistory = false,
    slots,
    role,
    formatDay,
    formatTimestamp = (value) => value,
    t,
    onOpen,
    onDrop,
    onDrag,
    dragging,
    busy,
}) => {
    const [historySlotKey, setHistorySlotKey] = useState(null);
    const all = [...appointments.map((item) => item.timeSlot), ...slots].filter((slot) => days.includes(slot?.day));
    const start = Math.min(8 * 60, ...all.map((slot) => Math.floor(minutes(slot.startingTime) / 60) * 60));
    const end = Math.max(18 * 60, ...all.map((slot) => Math.ceil(minutes(slot.endingTime) / 60) * 60));
    const scale = 1.4;
    const overlaps = (a, b) =>
        a.day === b.day &&
        minutes(a.startingTime) < minutes(b.endingTime) &&
        minutes(b.startingTime) < minutes(a.endingTime);
    const occupied = scheduleAppointments.filter((item) => item.status !== 'cancelled');
    const availableSlots =
        role === 'doctor'
            ? slots.filter((slot) => isFutureSlot(slot) && !occupied.some((item) => overlaps(slot, item.timeSlot)))
            : [];
    const historySlot = (appointment) =>
        availableSlots.find(
            (slot) =>
                slot.day === appointment.timeSlot.day &&
                minutes(slot.startingTime) <= minutes(appointment.timeSlot.startingTime) &&
                minutes(slot.endingTime) >= minutes(appointment.timeSlot.endingTime),
        );
    const gridAppointments = appointments.filter((appointment) => {
        if (role !== 'doctor' || appointment.status !== 'cancelled') return true;
        if (historySlot(appointment)) return false;
        return showCancelledHistory || !occupied.some((item) => overlaps(appointment.timeSlot, item.timeSlot));
    });
    const cancellationsFor = (slot) =>
        appointments.filter((item) => item.status === 'cancelled' && historySlot(item) === slot);
    const cancellation = (item) =>
        [...(item.statusHistory || [])].reverse().find((entry) => entry.status === 'cancelled');
    const cancelledAt = (item) => cancellation(item)?.timestamp;
    const groupSlot = availableSlots.find((slot) => slotKey(slot) === historySlotKey);
    const groupEntries = groupSlot
        ? cancellationsFor(groupSlot).sort(
              (a, b) => new Date(cancelledAt(b) || b.createdAt || 0) - new Date(cancelledAt(a) || a.createdAt || 0),
          )
        : [];
    return (
        <div className={styles.gridScroll} tabIndex={0} aria-label={t('title')}>
            <div className={styles.grid} style={{ '--days': days.length }}>
                <div className={styles.corner}>UTC+7</div>
                {days.map((day) => (
                    <div key={day} className={styles.dayHeader}>
                        {formatDay(day, true)}
                    </div>
                ))}
                <div className={styles.timeAxis} style={{ height: (end - start) * scale }}>
                    {Array.from({ length: (end - start) / 60 }, (_, index) => (
                        <span key={index} style={{ top: index * 60 * scale }}>
                            {clock(start + index * 60)}
                        </span>
                    ))}
                </div>
                {days.map((day) => (
                    <div key={day} className={styles.dayColumn} style={{ height: (end - start) * scale }}>
                        {role === 'doctor' &&
                            availableSlots
                                .filter((slot) => slot.day === day)
                                .map((slot) => {
                                    const cancelled = cancellationsFor(slot);
                                    const single = cancelled[0];
                                    return (
                                        <div
                                            key={slotKey(slot)}
                                            className={`${styles.freeSlot} ${dragging ? styles.dropTarget : ''}`}
                                            title={`${t('available')} ${slot.startingTime}–${slot.endingTime}`}
                                            style={{
                                                top: (minutes(slot.startingTime) - start) * scale,
                                                height:
                                                    (minutes(slot.endingTime) - minutes(slot.startingTime)) * scale - 2,
                                            }}
                                            onDragOver={(event) => {
                                                if (dragging && !busy) {
                                                    event.preventDefault();
                                                    event.dataTransfer.dropEffect = 'move';
                                                }
                                            }}
                                            onDrop={(event) => {
                                                event.preventDefault();
                                                if (!busy) onDrop(event.dataTransfer.getData('text/plain'), slot);
                                                onDrag(null);
                                            }}
                                        >
                                            <div className={styles.freeSlotHeading}>
                                                <span>{t(dragging ? 'drop' : 'available')}</span>
                                            </div>
                                            {cancelled.length ? (
                                                <button
                                                    type="button"
                                                    className={styles.cancelledSlotEntry}
                                                    onClick={() =>
                                                        cancelled.length === 1
                                                            ? onOpen(single._id)
                                                            : setHistorySlotKey(slotKey(slot))
                                                    }
                                                    title={
                                                        cancelled.length === 1
                                                            ? `${single.user?.fullname || t('unknown')} · ${t(
                                                                  'cancelled',
                                                              )}`
                                                            : t('cancelledCount', { count: cancelled.length })
                                                    }
                                                    aria-label={
                                                        cancelled.length === 1
                                                            ? `${single.user?.fullname || t('unknown')}, ${day}, ${
                                                                  single.timeSlot.startingTime
                                                              }–${single.timeSlot.endingTime}, ${t('cancelled')}`
                                                            : t('cancelledCount', { count: cancelled.length })
                                                    }
                                                >
                                                    <FiXCircle aria-hidden="true" />
                                                    <span>
                                                        {cancelled.length === 1
                                                            ? single.user?.fullname || t('unknown')
                                                            : t('cancelledCount', { count: cancelled.length })}
                                                    </span>
                                                </button>
                                            ) : (
                                                <time className={styles.freeSlotTime}>
                                                    {slot.startingTime}–{slot.endingTime}
                                                </time>
                                            )}
                                        </div>
                                    );
                                })}
                        {layoutEvents(gridAppointments.filter((item) => item.timeSlot.day === day)).map(
                            ({ appointment, start: eventStart, end: eventEnd, column, columns }) => {
                                const person = role === 'doctor' ? appointment.user : appointment.doctor;
                                const editable =
                                    role === 'doctor' &&
                                    appointment.status === 'pending' &&
                                    !appointment.isReExamination &&
                                    isFutureSlot(appointment.timeSlot) &&
                                    !busy;
                                return (
                                    <button
                                        key={appointment._id}
                                        type="button"
                                        className={`${styles.event} ${styles[appointment.status] || ''}`}
                                        draggable={editable}
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('text/plain', appointment._id);
                                            event.dataTransfer.effectAllowed = 'move';
                                            onDrag(appointment._id);
                                        }}
                                        onDragEnd={() => onDrag(null)}
                                        onClick={() => onOpen(appointment._id)}
                                        aria-label={`${person?.fullname || t('unknown')}, ${day}, ${
                                            appointment.timeSlot.startingTime
                                        }–${appointment.timeSlot.endingTime}, ${t(appointment.status)}`}
                                        title={`${person?.fullname || t('unknown')} · ${
                                            appointment.timeSlot.startingTime
                                        }–${appointment.timeSlot.endingTime} · ${t(appointment.status)}`}
                                        style={{
                                            top: (eventStart - start) * scale,
                                            height: Math.max(26, (eventEnd - eventStart) * scale - 2),
                                            left: `calc(${(column * 100) / columns}% + 2px)`,
                                            width: `calc(${100 / columns}% - 4px)`,
                                        }}
                                    >
                                        <strong>{person?.fullname || t('unknown')}</strong>
                                        <span>
                                            {appointment.timeSlot.startingTime}–{appointment.timeSlot.endingTime}
                                        </span>
                                        <span className={styles.srOnly}>{t(appointment.status)}</span>
                                    </button>
                                );
                            },
                        )}
                    </div>
                ))}
            </div>
            <Drawer
                anchor="right"
                open={Boolean(groupSlot && groupEntries.length)}
                onClose={() => setHistorySlotKey(null)}
                PaperProps={{ className: styles.drawer }}
            >
                {groupSlot && (
                    <div
                        className={styles.detail}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="slot-cancellations-title"
                    >
                        <header>
                            <h2 id="slot-cancellations-title">{t('cancelledAppointments')}</h2>
                            <button
                                className={styles.detailClose}
                                autoFocus
                                aria-label={t('close')}
                                onClick={() => setHistorySlotKey(null)}
                            >
                                <FiX aria-hidden="true" />
                            </button>
                        </header>
                        <p className={styles.detailTime}>
                            <span>{formatDay(groupSlot.day)}</span>
                            <span className={styles.detailTimeSeparator}>|</span>
                            <span>
                                {groupSlot.startingTime}–{groupSlot.endingTime}
                            </span>
                        </p>
                        <ul className={styles.cancellationList}>
                            {groupEntries.map((item) => (
                                <li key={item._id}>
                                    <button type="button" onClick={() => onOpen(item._id)}>
                                        <span>
                                            <FiXCircle aria-hidden="true" />
                                            {item.user?.fullname || t('unknown')}
                                        </span>
                                        {cancelledAt(item) && (
                                            <small>
                                                {t('cancelledAt', { time: formatTimestamp(cancelledAt(item)) })}
                                            </small>
                                        )}
                                        {cancellation(item)?.actorName && (
                                            <small>{t('changedBy', { name: cancellation(item).actorName })}</small>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

CalendarGrid.propTypes = {
    days: PropTypes.array.isRequired,
    appointments: PropTypes.array.isRequired,
    scheduleAppointments: PropTypes.array,
    showCancelledHistory: PropTypes.bool,
    slots: PropTypes.array.isRequired,
    role: PropTypes.string.isRequired,
    formatDay: PropTypes.func.isRequired,
    formatTimestamp: PropTypes.func,
    t: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
    onDrag: PropTypes.func.isRequired,
    dragging: PropTypes.string,
    busy: PropTypes.bool,
};

export default CalendarGrid;

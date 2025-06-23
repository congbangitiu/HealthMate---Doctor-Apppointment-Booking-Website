import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AppointmentManagement.module.scss';
import Selections from '../../../components/Selections/Selections';
import { PropTypes } from 'prop-types';
import convertTime from './../../../utils/date-time/convertTime';
import formatDate from '../../../utils/date-time/formatDate';
import Pagination from '../../../components/Pagination/Pagination';
import { useTranslation } from 'react-i18next';
import translateAppointmentStatus from './../../../utils/translation/translateAppointmentStatus';

const cx = classNames.bind(styles);

const AppointmentManagement = ({ users, doctors, appointments }) => {
    const { t, i18n } = useTranslation('appointmentManagement');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState({
        value: 'newest',
        label: t('filter.newest'),
    });
    const [filteredAppointments, setFilteredAppointments] = useState(appointments);

    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 10;

    const officialDoctors = doctors.filter((doctor) => doctor.isApproved === 'approved');
    const patients = users.filter((user) => user.role === 'patient');

    const doctorsOptions = [
        { value: 'all', label: t('filter.allDoctors') },
        ...officialDoctors.map((doctor) => ({
            value: doctor.fullname,
            label: t('prefix') + doctor.fullname,
        })),
    ];

    const patientsOptions = [
        { value: 'all', label: t('filter.allPatients') },
        ...patients.map((patient) => ({
            value: patient.fullname,
            label: patient.fullname,
        })),
    ];

    const appointmentsStatusOptions = [
        { value: 'all', label: t('filter.allAppointments') },
        { value: 'pending', label: t('status.pending') },
        { value: 'done', label: t('status.done') },
        { value: 'cancelled', label: t('status.cancelled') },
    ];

    useEffect(() => {
        let updatedAppointments = [...appointments];

        // Filter by selected doctor
        if (selectedDoctor && selectedDoctor.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.doctor && appointment.doctor.fullname === selectedDoctor.value,
            );
        }

        // Filter by selected patient
        if (selectedPatient && selectedPatient.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.user && appointment.user.fullname === selectedPatient.value,
            );
        }

        // Filter by selected status
        if (selectedAppointmentStatus && selectedAppointmentStatus.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.status === selectedAppointmentStatus.value,
            );
        }

        // Sort by Schedule
        if (selectedSchedule && selectedSchedule.value) {
            updatedAppointments.sort((a, b) => {
                if (selectedSchedule.value === 'newest') {
                    // Newest to Oldest
                    if (a.timeSlot.day !== b.timeSlot.day) {
                        return new Date(b.timeSlot.day) - new Date(a.timeSlot.day);
                    }
                    return (
                        new Date(`1970-01-01T${b.timeSlot.startingTime}:00Z`) -
                        new Date(`1970-01-01T${a.timeSlot.startingTime}:00Z`)
                    );
                } else if (selectedSchedule.value === 'oldest') {
                    // Oldest to Newest
                    if (a.timeSlot.day !== b.timeSlot.day) {
                        return new Date(a.timeSlot.day) - new Date(b.timeSlot.day);
                    }
                    return (
                        new Date(`1970-01-01T${a.timeSlot.startingTime}:00Z`) -
                        new Date(`1970-01-01T${b.timeSlot.startingTime}:00Z`)
                    );
                }
                return 0;
            });

            updatedAppointments = [...updatedAppointments];
        }

        setFilteredAppointments(updatedAppointments);
    }, [selectedDoctor, selectedPatient, selectedAppointmentStatus, selectedSchedule, appointments]);

    useEffect(() => {
        const offset = currentPage * itemsPerPage;
        const items = filteredAppointments.slice(offset, offset + itemsPerPage);
        setCurrentItems(items);
    }, [currentPage, filteredAppointments, itemsPerPage]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    useEffect(() => {
        // Rebuild schedule option based on language
        if (selectedSchedule?.value) {
            setSelectedSchedule({
                value: selectedSchedule.value,
                label: t(`filter.${selectedSchedule.value}`),
            });
        }

        // Rebuild patient option
        if (selectedDoctor?.value === 'all') {
            setSelectedDoctor({
                value: 'all',
                label: t('filter.allPatients'),
            });
        }

        // Rebuild appointment status option
        if (selectedAppointmentStatus) {
            const statusMap = {
                all: t('status.allStatuses'),
                pending: t('status.pending'),
                done: t('status.done'),
                cancelled: t('status.cancelled'),
            };
            setSelectedAppointmentStatus({
                value: selectedAppointmentStatus.value,
                label: statusMap[selectedAppointmentStatus.value],
            });
        }
    }, [i18n.language]);

    return (
        <div className={cx('container')}>
            <div className={cx('upper-part')}>
                <h4>
                    {t('title')} ({filteredAppointments.length})
                </h4>
                <div className={cx('selections')}>
                    <Selections
                        selectedDoctor={selectedDoctor}
                        setSelectedDoctor={setSelectedDoctor}
                        doctorsOptions={doctorsOptions}
                        selectedPatient={selectedPatient}
                        setSelectedPatient={setSelectedPatient}
                        patientsOptions={patientsOptions}
                        selectedAppointmentStatus={selectedAppointmentStatus}
                        setSelectedAppointmentStatus={setSelectedAppointmentStatus}
                        appointmentsStatusOptions={appointmentsStatusOptions}
                        selectedSchedule={selectedSchedule}
                        setSelectedSchedule={setSelectedSchedule}
                    />
                </div>
            </div>

            <div className={cx('lower-part')}>
                {filteredAppointments.length > 0 ? (
                    <table className={cx('appointment-table')}>
                        <thead>
                            <tr>
                                <th>{t('columns.patient')}</th>
                                <th>{t('columns.doctor')}</th>
                                <th>{t('columns.date')}</th>
                                <th>{t('columns.time')}</th>
                                <th>{t('columns.fee')}</th>
                                <th>{t('columns.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((appointment, index) => (
                                <tr key={index} className={cx({ cancelledStatus: appointment.status === 'cancelled' })}>
                                    <td
                                        className={cx({
                                            cancelledStatus: appointment.status === 'cancelled',
                                        })}
                                    >
                                        {appointment.user ? (
                                            appointment.status === 'cancelled' ? (
                                                <Link className={cx('info-cell', 'cancelledStatus')}>
                                                    <img
                                                        src={appointment.user.photo || ''}
                                                        alt=""
                                                        className={cx('avatar')}
                                                    />
                                                    <div>
                                                        <div>{appointment.user.fullname}</div>
                                                        <div>{appointment.user.email || t('noEmail')}</div>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={`/users/appointments/my-appointments/${appointment._id}`}
                                                    className={cx('info-cell')}
                                                >
                                                    <img
                                                        src={appointment.user.photo || ''}
                                                        alt=""
                                                        className={cx('avatar')}
                                                    />
                                                    <div>
                                                        <div>{appointment.user.fullname}</div>
                                                        <div>{appointment.user.email || t('noEmail')}</div>
                                                    </div>
                                                </Link>
                                            )
                                        ) : (
                                            <div>{t('na')}</div>
                                        )}
                                    </td>
                                    <td
                                        className={cx({
                                            cancelledStatus: appointment.status === 'cancelled',
                                        })}
                                    >
                                        {appointment.doctor ? (
                                            appointment.status === 'cancelled' ? (
                                                <Link className={cx('info-cell', 'cancelledStatus')}>
                                                    <img
                                                        src={appointment.doctor.photo || ''}
                                                        alt=""
                                                        className={cx('avatar')}
                                                    />
                                                    <div>
                                                        <div>{appointment.doctor.fullname}</div>
                                                        <div>{appointment.doctor.email || t('noEmail')}</div>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={`/users/appointments/my-appointments/${appointment._id}`}
                                                    className={cx('info-cell')}
                                                >
                                                    <img
                                                        src={appointment.doctor.photo || ''}
                                                        alt=""
                                                        className={cx('avatar')}
                                                    />
                                                    <div>
                                                        <div>{appointment.doctor.fullname}</div>
                                                        <div>{appointment.doctor.email || t('noEmail')}</div>
                                                    </div>
                                                </Link>
                                            )
                                        ) : (
                                            <div>N/A</div>
                                        )}
                                    </td>
                                    <td
                                        className={cx({
                                            cancelledStatus: appointment.status === 'cancelled',
                                        })}
                                    >
                                        {appointment.timeSlot ? (
                                            appointment.status === 'cancelled' ? (
                                                <Link className={cx('cancelledStatus')}>
                                                    {formatDate(appointment.timeSlot.day) || t('noDate')}
                                                </Link>
                                            ) : (
                                                <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                                    {formatDate(appointment.timeSlot.day) || t('noDate')}
                                                </Link>
                                            )
                                        ) : (
                                            <div>N/A</div>
                                        )}
                                    </td>
                                    <td
                                        className={cx({
                                            cancelledStatus: appointment.status === 'cancelled',
                                        })}
                                    >
                                        {appointment.timeSlot ? (
                                            appointment.status === 'cancelled' ? (
                                                <Link className={cx('cancelledStatus')}>
                                                    {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                                    {convertTime(appointment.timeSlot.endingTime)}
                                                </Link>
                                            ) : (
                                                <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                                    {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                                    {convertTime(appointment.timeSlot.endingTime)}
                                                </Link>
                                            )
                                        ) : (
                                            <div>N/A</div>
                                        )}
                                    </td>
                                    <td
                                        className={cx({
                                            cancelledStatus: appointment.status === 'cancelled',
                                        })}
                                    >
                                        {appointment.ticketPrice ? (
                                            appointment.status === 'cancelled' ? (
                                                <Link className={cx('cancelledStatus')}>
                                                    ${appointment.ticketPrice}
                                                </Link>
                                            ) : (
                                                <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                                    ${appointment.ticketPrice}
                                                </Link>
                                            )
                                        ) : (
                                            <div>N/A</div>
                                        )}
                                    </td>
                                    <td
                                        className={cx({
                                            cancelledStatus: appointment.status === 'cancelled',
                                        })}
                                    >
                                        {appointment.status ? (
                                            appointment.status === 'cancelled' ? (
                                                <Link className={cx(appointment.status, 'cancelledStatus')}>
                                                    {translateAppointmentStatus(appointment.status, t)}
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={`/users/appointments/my-appointments/${appointment._id}`}
                                                    className={cx(appointment.status)}
                                                >
                                                    {translateAppointmentStatus(appointment.status, t)}
                                                </Link>
                                            )
                                        ) : (
                                            <div>N/A</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={cx('no-appointment')}>{t('noAppointments')}</div>
                )}
            </div>

            {filteredAppointments.length > itemsPerPage && (
                <Pagination
                    data={filteredAppointments}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    setCurrentItems={setCurrentItems}
                />
            )}
        </div>
    );
};

AppointmentManagement.propTypes = {
    users: PropTypes.array,
    doctors: PropTypes.array,
    appointments: PropTypes.array,
};

export default AppointmentManagement;

import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Appointments.module.scss';
import { Link } from 'react-router-dom';
import formatDate from '../../../utils/date-time/formatDate';
import convertTime from '../../../utils/date-time/convertTime';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import Selections from '../../../components/Selections/Selections';
import Pagination from '../../../components/Pagination/Pagination';
import { useTranslation } from 'react-i18next';
const cx = classNames.bind(styles);

const Appointments = () => {
    const { t, i18n } = useTranslation('appointmentsDoctor');
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const { data: appointments, loading, error } = useFetchData(`${BASE_URL}/doctors/appointments/my-appointments`);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState({
        value: 'newest',
        label: t('filters.newest'),
    });
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 5;

    useEffect(() => {
        let updatedAppointments = appointments;

        // Filter by patient
        if (selectedPatient && selectedPatient.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.user?.fullname === selectedPatient.value,
            );
        }

        // Filter by appointment status
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
    }, [selectedPatient, selectedAppointmentStatus, selectedSchedule, appointments]);

    const patientsOptions = [
        { value: 'all', label: t('filters.allPatients') },
        ...Array.from(new Set(appointments.map((appointment) => appointment.user?.fullname)))
            .filter((fullname) => fullname) // Remove value undefined/null
            .map((fullname) => ({
                value: fullname,
                label: fullname,
            })),
    ];

    const appointmentsStatusOptions = [
        { value: 'all', label: t('filters.allStatuses') },
        { value: 'pending', label: t('filters.pending') },
        { value: 'done', label: t('filters.done') },
        { value: 'cancelled', label: t('filters.cancelled') },
    ];

    useEffect(() => {
        const offset = currentPage * itemsPerPage;
        const items = filteredAppointments.slice(offset, offset + itemsPerPage);
        setCurrentItems(items);
    }, [currentPage, filteredAppointments, itemsPerPage]);

    useEffect(() => {
        // Rebuild schedule option based on language
        if (selectedSchedule?.value) {
            setSelectedSchedule({
                value: selectedSchedule.value,
                label: t(`filters.${selectedSchedule.value}`),
            });
        }

        // Rebuild patient option
        if (selectedPatient?.value === 'all') {
            setSelectedPatient({
                value: 'all',
                label: t('filters.allPatients'),
            });
        }

        // Rebuild appointment status option
        if (selectedAppointmentStatus) {
            const statusMap = {
                all: t('filters.allStatuses'),
                pending: t('filters.pending'),
                done: t('filters.done'),
                cancelled: t('filters.cancelled'),
            };
            setSelectedAppointmentStatus({
                value: selectedAppointmentStatus.value,
                label: statusMap[selectedAppointmentStatus.value],
            });
        }
    }, [i18n.language]);

    return (
        <div className={cx('container-parent')}>
            <h1>{t('title')}</h1>
            <div className={cx('selection')}>
                <Selections
                    selectedPatient={selectedPatient}
                    setSelectedPatient={setSelectedPatient}
                    patientsOptions={patientsOptions}
                    selectedAppointmentStatus={selectedAppointmentStatus}
                    setSelectedAppointmentStatus={setSelectedAppointmentStatus}
                    appointmentsStatusOptions={appointmentsStatusOptions}
                    selectedSchedule={selectedSchedule}
                    setSelectedSchedule={setSelectedSchedule}
                    hideDoctor={true}
                />
            </div>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    {filteredAppointments.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">{t('columns.fullname')}</th>
                                    <th scope="col">{t('columns.phone')}</th>
                                    <th scope="col">{t('columns.gender')}</th>
                                    <th scope="col">{t('columns.date')}</th>
                                    <th scope="col">{t('columns.time')}</th>
                                    <th scope="col">{t('columns.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems?.map((appointment) => (
                                    <tr
                                        key={appointment._id}
                                        className={cx({ cancelledStatus: appointment.status === 'cancelled' })}
                                    >
                                        <td
                                            className={cx({
                                                cancelledStatus: appointment.status === 'cancelled',
                                            })}
                                        >
                                            {appointment.user ? (
                                                appointment.status === 'cancelled' ? (
                                                    <Link
                                                        className={cx('link', {
                                                            cancelledStatus: appointment.status === 'cancelled',
                                                        })}
                                                    >
                                                        {appointment.user.fullname}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                                        className={cx('link')}
                                                    >
                                                        {appointment.user.fullname}
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
                                            {appointment.user ? (
                                                appointment.status === 'cancelled' ? (
                                                    <Link
                                                        className={cx('link', {
                                                            cancelledStatus: appointment.status === 'cancelled',
                                                        })}
                                                    >
                                                        {'0' + appointment.user.phone}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                                        className={cx('link')}
                                                    >
                                                        {'0' + appointment.user.phone}
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
                                            {appointment.user ? (
                                                appointment.status === 'cancelled' ? (
                                                    <Link
                                                        className={cx('captitalized', {
                                                            cancelledStatus: appointment.status === 'cancelled',
                                                        })}
                                                    >
                                                        {appointment.user.gender}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                                        className={cx('captitalized')}
                                                    >
                                                        {appointment.user.gender}
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
                                                    <Link
                                                        className={cx('link', {
                                                            cancelledStatus: appointment.status === 'cancelled',
                                                        })}
                                                    >
                                                        {formatDate(appointment.timeSlot.day)}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                                    >
                                                        {formatDate(appointment.timeSlot.day)}
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
                                                    <Link
                                                        className={cx('link', {
                                                            cancelledStatus: appointment.status === 'cancelled',
                                                        })}
                                                    >
                                                        {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                                        {convertTime(appointment.timeSlot.endingTime)}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                                    >
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
                                            {appointment.status ? (
                                                appointment.status === 'cancelled' ? (
                                                    <Link
                                                        className={cx(
                                                            appointment.status,
                                                            'cancelledStatus',
                                                            'captitalized',
                                                        )}
                                                    >
                                                        {appointment.status}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                                        className={cx(appointment.status, 'captitalized')}
                                                    >
                                                        {appointment.status}
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
                        <div className={cx('no-appointment')}>{t('noAppointment')}</div>
                    )}
                </div>
            )}

            {!loading && filteredAppointments.length > itemsPerPage && (
                <Pagination
                    data={filteredAppointments}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                />
            )}
        </div>
    );
};

export default Appointments;

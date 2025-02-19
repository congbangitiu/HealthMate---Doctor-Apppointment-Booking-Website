import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Appointments.module.scss';
import { Link } from 'react-router-dom';
import formatDate from '../../../utils/formatDate';
import convertTime from '../../../utils/convertTime';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import Selections from '../../../components/Selections/Selections';

const cx = classNames.bind(styles);

const Appointments = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const { data: appointments, loading, error } = useFetchData(`${BASE_URL}/doctors/appointments/my-appointments`);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState(null);
    const [filteredAppointments, setFilteredAppointments] = useState([]);

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

        setFilteredAppointments(updatedAppointments);
    }, [selectedPatient, selectedAppointmentStatus, appointments]);

    const patientsOptions = [
        { value: 'all', label: 'All Patients' },
        ...Array.from(new Set(appointments.map((appointment) => appointment.user?.fullname)))
            .filter((fullname) => fullname) // Remove value undefined/null
            .map((fullname) => ({
                value: fullname,
                label: fullname,
            })),
    ];

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'done', label: 'Done' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div className={cx('container-parent')}>
            <h1>MY APPOINTMENTS</h1>
            <div className={cx('selection')}>
                <Selections
                    selectedPatient={selectedPatient}
                    setSelectedPatient={setSelectedPatient}
                    patientsOptions={patientsOptions}
                    selectedAppointmentStatus={selectedAppointmentStatus}
                    setSelectedAppointmentStatus={setSelectedAppointmentStatus}
                    appointmentsOptions={statusOptions}
                    hideDoctor={true}
                    justify = 'space-around'
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
                                    <th scope="col">Full name</th>
                                    <th scope="col">Phone</th>
                                    <th scope="col">Gender</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">Time</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments?.map((appointment) => (
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
                        <h4>No appointments found!</h4>
                    )}
                </div>
            )}
        </div>
    );
};

Appointments.propTypes = {
    appointments: PropTypes.object.isRequired,
};

export default Appointments;

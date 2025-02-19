import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AppointmentManagement.module.scss';
import Selections from '../../../components/Selections/Selections';
import { PropTypes } from 'prop-types';
import convertTime from './../../../utils/convertTime';
import Pagination from '../../../components/Pagination/Pagination';

const cx = classNames.bind(styles);

const AppointmentManagement = ({ users, doctors, appointments }) => {
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState(null);
    const [filteredAppointments, setFilteredAppointments] = useState(appointments);

    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 10;

    const officialDoctors = doctors.filter((doctor) => doctor.isApproved === 'approved');
    const patients = users.filter((user) => user.role === 'patient');

    const doctorsOptions = [
        { value: 'all', label: 'All Doctors' },
        ...officialDoctors.map((doctor) => ({
            value: doctor.fullname,
            label: 'Dr. ' + doctor.fullname,
        })),
    ];

    const patientsOptions = [
        { value: 'all', label: 'All Patients' },
        ...patients.map((patient) => ({
            value: patient.fullname,
            label: patient.fullname,
        })),
    ];

    const appointmentsOptions = [
        { value: 'all', label: 'All Appointments' },
        { value: 'pending', label: 'Pending' },
        { value: 'done', label: 'Done' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    useEffect(() => {
        let updatedAppointments = appointments;

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

        setFilteredAppointments(updatedAppointments);
    }, [selectedDoctor, selectedPatient, selectedAppointmentStatus, appointments]);

    useEffect(() => {
        const offset = currentPage * itemsPerPage;
        const items = filteredAppointments.slice(offset, offset + itemsPerPage);
        setCurrentItems(items);
    }, [currentPage, filteredAppointments, itemsPerPage]);

    return (
        <div className={cx('container')}>
            <div className={cx('upper-part')}>
                <h4>Appointments ({filteredAppointments.length})</h4>
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
                        appointmentsOptions={appointmentsOptions}
                        justify="space-between"
                    />
                </div>
            </div>

            <div className={cx('lower-part')}>
                <table className={cx('appointment-table')}>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Fee</th>
                            <th>Status</th>
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
                                                    <div>{appointment.user.email || 'No email'}</div>
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
                                                    <div>{appointment.user.email || 'No email'}</div>
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
                                                    <div>{appointment.doctor.email || 'No email'}</div>
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
                                                    <div>{appointment.doctor.email || 'No email'}</div>
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
                                                {appointment.timeSlot.day || 'No date'}
                                            </Link>
                                        ) : (
                                            <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                                {appointment.timeSlot.day || 'No date'}
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
                                            <Link className={cx('cancelledStatus')}>${appointment.ticketPrice}</Link>
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
                                            <Link className={cx(appointment.status, 'cancelledStatus', 'captitalized')}>
                                                {appointment.status}
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/users/appointments/my-appointments/${appointment._id}`}
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
            </div>

            {filteredAppointments.length !== 0 && (
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

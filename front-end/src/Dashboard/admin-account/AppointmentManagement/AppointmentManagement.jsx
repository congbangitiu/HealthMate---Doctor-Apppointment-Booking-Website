import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AppointmentManagement.module.scss';
import Select from 'react-select';
import { PropTypes } from 'prop-types';
import convertTime from './../../../utils/convertTime';
import Pagination from '../../../components/Pagination/Pagination';

const cx = classNames.bind(styles);

const customStyles = {
    control: (provided) => ({
        ...provided,
        border: '2px solid var(--primaryColor)',
        borderRadius: '5px',
        boxShadow: 'none',
        width: '250px',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        '&:hover': {
            cursor: 'text',
        },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? 'var(--primaryColor)'
            : state.isFocused
            ? 'var(--lightGreenColor)'
            : 'white',
        color: state.isSelected ? 'white' : 'black',
        '&:hover': {
            backgroundColor: 'var(--lightGreenColor)',
        },
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
};

const AppointmentManagement = ({ users, doctors, appointments }) => {
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
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
                (appointment) => appointment.doctor.fullname === selectedDoctor.value,
            );
        }

        // Filter by selected patient
        if (selectedPatient && selectedPatient.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.user.fullname === selectedPatient.value,
            );
        }

        // Filter by selected status
        if (selectedAppointment && selectedAppointment.value !== 'all') {
            updatedAppointments = updatedAppointments.filter(
                (appointment) => appointment.status === selectedAppointment.value,
            );
        }

        setFilteredAppointments(updatedAppointments);
    }, [selectedDoctor, selectedPatient, selectedAppointment, appointments]);

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
                    <div className={cx('selection')}>
                        <h4>Doctor</h4>
                        <Select
                            options={doctorsOptions}
                            styles={customStyles}
                            placeholder={doctorsOptions[0].label}
                            value={selectedDoctor}
                            onChange={setSelectedDoctor}
                        />
                    </div>
                    <div className={cx('selection')}>
                        <h4>Patient</h4>
                        <Select
                            options={patientsOptions}
                            styles={customStyles}
                            placeholder={patientsOptions[0].label}
                            value={selectedPatient}
                            onChange={setSelectedPatient}
                        />
                    </div>
                    <div className={cx('selection')}>
                        <h4>Status</h4>
                        <Select
                            options={appointmentsOptions}
                            styles={customStyles}
                            placeholder={appointmentsOptions[0].label}
                            value={selectedAppointment}
                            onChange={setSelectedAppointment}
                        />
                    </div>
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
                                    {appointment.status === 'cancelled' ? (
                                        <Link className={cx('info-cell', 'cancelledStatus')}>
                                            <img src={appointment.user.photo} alt="" className={cx('avatar')} />
                                            <div>
                                                <div>{appointment.user.fullname}</div>
                                                <div>{appointment.user.email}</div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/users/appointments/my-appointments/${appointment._id}`}
                                            className={cx('info-cell')}
                                        >
                                            <img src={appointment.user.photo} alt="" className={cx('avatar')} />
                                            <div>
                                                <div>{appointment.user.fullname}</div>
                                                <div>{appointment.user.email}</div>
                                            </div>
                                        </Link>
                                    )}
                                </td>
                                <td
                                    className={cx({
                                        cancelledStatus: appointment.status === 'cancelled',
                                    })}
                                >
                                    {appointment.status === 'cancelled' ? (
                                        <Link className={cx('info-cell', 'cancelledStatus')}>
                                            <img src={appointment.doctor.photo} alt="" className={cx('avatar')} />
                                            <div>
                                                <div>{appointment.doctor.fullname}</div>
                                                <div>{appointment.doctor.email}</div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/users/appointments/my-appointments/${appointment._id}`}
                                            className={cx('info-cell')}
                                        >
                                            <img src={appointment.doctor.photo} alt="" className={cx('avatar')} />
                                            <div>
                                                <div>{appointment.doctor.fullname}</div>
                                                <div>{appointment.doctor.email}</div>
                                            </div>
                                        </Link>
                                    )}
                                </td>
                                <td
                                    className={cx({
                                        cancelledStatus: appointment.status === 'cancelled',
                                    })}
                                >
                                    {appointment.status === 'cancelled' ? (
                                        <Link className={cx('cancelledStatus')}>{appointment.timeSlot.day}</Link>
                                    ) : (
                                        <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                            {appointment.timeSlot.day}
                                        </Link>
                                    )}
                                </td>
                                <td
                                    className={cx({
                                        cancelledStatus: appointment.status === 'cancelled',
                                    })}
                                >
                                    {appointment.status === 'cancelled' ? (
                                        <Link className={cx('cancelledStatus')}>
                                            {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                            {convertTime(appointment.timeSlot.endingTime)}
                                        </Link>
                                    ) : (
                                        <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                            {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                            {convertTime(appointment.timeSlot.endingTime)}
                                        </Link>
                                    )}
                                </td>
                                <td
                                    className={cx({
                                        cancelledStatus: appointment.status === 'cancelled',
                                    })}
                                >
                                    {appointment.status === 'cancelled' ? (
                                        <Link className={cx('cancelledStatus')}>${appointment.ticketPrice}</Link>
                                    ) : (
                                        <Link to={`/users/appointments/my-appointments/${appointment._id}`}>
                                            ${appointment.ticketPrice}
                                        </Link>
                                    )}
                                </td>
                                <td
                                    className={cx({
                                        cancelledStatus: appointment.status === 'cancelled',
                                    })}
                                >
                                    {appointment.status === 'cancelled' ? (
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

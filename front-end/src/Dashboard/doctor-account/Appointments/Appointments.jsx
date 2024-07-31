import { useEffect } from 'react';
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

const cx = classNames.bind(styles);

const Appointments = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const { data: appointments, loading, error } = useFetchData(`${BASE_URL}/doctors/appointments/my-appointments`);

    return (
        <div className={cx('container-parent')}>
            <h1>MY APPOINTMENTS</h1>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Full name</th>
                                <th scope="col">Email</th>
                                <th scope="col">Phone</th>
                                <th scope="col">Gender</th>
                                <th scope="col">Date</th>
                                <th scope="col">Time</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments?.map((appointment) => (
                                <tr key={appointment._id}>
                                    <td>
                                        <Link
                                            to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                            className={cx('link')}
                                        >
                                            {appointment.user.fullname}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/doctors/appointments/my-appointments/${appointment._id}`}>
                                            {appointment.user.email}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/doctors/appointments/my-appointments/${appointment._id}`}>
                                            {appointment.user.phone}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/doctors/appointments/my-appointments/${appointment._id}`}>
                                            {appointment.user.gender}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/doctors/appointments/my-appointments/${appointment._id}`}>
                                            {formatDate(appointment.timeSlot.day)}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/doctors/appointments/my-appointments/${appointment._id}`}>
                                            {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                            {convertTime(appointment.timeSlot.endingTime)}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link
                                            to={`/doctors/appointments/my-appointments/${appointment._id}`}
                                            className={cx(appointment.status)}
                                        >
                                            {appointment.status}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

Appointments.propTypes = {
    appointments: PropTypes.object.isRequired,
};

export default Appointments;

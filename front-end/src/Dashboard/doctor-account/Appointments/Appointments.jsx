import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Appointments.module.scss';
import formatDate from '../../../utils/formatDate';
import convertTime from '../../../utils/convertTime';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';

const cx = classNames.bind(styles);

const Appointments = () => {
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
                                <th scope="col">Payment</th>
                                <th scope="col">Date</th>
                                <th scope="col">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments?.map((appointment) => (
                                <tr key={appointment._id}>
                                    <td>{appointment.user.fullname}</td>
                                    <td>{appointment.user.email}</td>
                                    <td>{appointment.user.phone}</td>
                                    <td>{appointment.user.gender}</td>
                                    <td>
                                        {appointment.isPaid && <div>Paid</div>}
                                        {!appointment.isPaid && <div>Unpaid</div>}
                                    </td>
                                    <td>{formatDate(appointment.timeSlot.day)}</td>
                                    <td>
                                        {convertTime(appointment.timeSlot.startingTime)} -{' '}
                                        {convertTime(appointment.timeSlot.endingTime)}
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

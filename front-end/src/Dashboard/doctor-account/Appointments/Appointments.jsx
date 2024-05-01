import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Appointments.module.scss';
import formatDate from '../../../utils/formatDate';

const cx = classNames.bind(styles);

const Appointments = ({ appointments }) => {
    return (
        <div className={cx('container')}>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Gender</th>
                        <th scope="col">Payment</th>
                        <th scope="col">Price</th>
                        <th scope="col">Booking time</th>
                    </tr>
                </thead>
                <tbody>
                    {appointments?.map((appointment) => (
                        <tr key={appointment._id}>
                            <th scope="row">
                                <img src={appointment.user.photo} alt="" />
                                <div>
                                    <div>{appointment.user.name}</div>
                                    <div>{appointment.user.email}</div>
                                </div>
                            </th>
                            <td>{appointment.user.gender}</td>
                            <td>
                                {appointment.isPaid && <div>Paid</div>} {!appointment.isPaid && <div>Unpaid</div>}
                            </td>
                            <td>{appointment.ticketPrice}</td>
                            <td>{formatDate(appointment.createAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

Appointments.propTypes = {
    appointments: PropTypes.object.isRequired,
};

export default Appointments;

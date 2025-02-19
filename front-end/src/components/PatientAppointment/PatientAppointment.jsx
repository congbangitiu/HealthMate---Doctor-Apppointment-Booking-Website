import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import styles from './PatientAppointment.module.scss';
import { MdEmail, MdOutlineDone, MdOutlinePendingActions } from 'react-icons/md';
import { FaPhoneAlt } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import formatDate from './../../utils/formatDate';
import convertTime from './../../utils/convertTime';

const cx = classNames.bind(styles);

const PatientAppointment = ({ appointment }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'done':
                return { color: 'var(--primaryColor)', icon: MdOutlineDone };
            case 'pending':
                return { color: 'var(--darkYellowColor)', icon: MdOutlinePendingActions };
            case 'cancelled':
                return { color: 'red', icon: IoMdClose };
            default:
                return { color: 'black', icon: null };
        }
    };

    const statusStyle = getStatusStyle(appointment.status);
    const StatusIcon = statusStyle.icon;

    return (
        <div className={cx('container')}>
            <img src={appointment.doctor.photo} alt="" />
            <div className={cx('info')}>
                <div className={cx('upperPart')}>
                    <div>
                        <h4>Dr. {appointment.doctor.fullname}</h4>
                        <span>{appointment.doctor.specialization}</span>
                    </div>
                    <div style={{ color: statusStyle.color }}>
                        {StatusIcon && <StatusIcon className={cx('icon')} style={{ color: statusStyle.color }} />}
                        {appointment.status}{' '}
                    </div>
                </div>
                <div className={cx('lowerPart')}>
                    <div>
                        <span>
                            <MdEmail className={cx('icon')} />
                            {appointment.doctor.email}
                        </span>
                        <span>
                            <FaPhoneAlt className={cx('icon')} />
                            {'0' + appointment.doctor.phone}
                        </span>
                    </div>
                    <div>
                        <h4>{formatDate(appointment.timeSlot.day)}</h4>
                        <h4>
                            {convertTime(appointment.timeSlot.startingTime)} -{' '}
                            {convertTime(appointment.timeSlot.endingTime)}
                        </h4>{' '}
                    </div>
                </div>
            </div>
        </div>
    );
};

PatientAppointment.propTypes = {
    appointment: PropTypes.object.isRequired,
};

export default PatientAppointment;

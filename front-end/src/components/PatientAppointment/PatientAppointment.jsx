import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import styles from './PatientAppointment.module.scss';
import { MdEmail } from 'react-icons/md';
import { FaPhoneAlt } from 'react-icons/fa';
import formatDate from './../../utils/formatDate';
import convertTime from './../../utils/convertTime';
import useFetchData from '../../hooks/useFetchData';
import { BASE_URL } from '../../../config';

const cx = classNames.bind(styles);

const PatientAppointment = ({ appointment }) => {
    const { data: doctor } = useFetchData(`${BASE_URL}/doctors/${appointment.doctor._id}`);

    return (
        <div className={cx('container')}>
            <img src={doctor.photo} alt="" />
            <div className={cx('info')}>
                <div className={cx('upperPart')}>
                    <h4>Dr. {doctor.fullname || 'Loading ...'}</h4>
                    <span>{doctor.specialization || 'Loading ...'}</span>
                </div>
                <div className={cx('lowerPart')}>
                    <div>
                        <span>
                            <MdEmail className={cx('icon')} />
                            {doctor.email || 'Loading ...'}
                        </span>
                        <span>
                            <FaPhoneAlt className={cx('icon')} />
                            {doctor.phone || 'Loading ...'}
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

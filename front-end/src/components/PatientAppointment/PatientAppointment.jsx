import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import styles from './PatientAppointment.module.scss';
import { MdEmail } from 'react-icons/md';
import { FaPhoneAlt } from 'react-icons/fa';
import convertTime from './../../utils/convertTime';

const cx = classNames.bind(styles);

const PatientAppointment = ({ doctor }) => {
    console.log(doctor);
    return (
        <div className={cx('container')}>
            <img src={doctor.photo} alt="" />
            <div className={cx('info')}>
                <div className={cx('upperPart')}>
                    <h4>Dr. {doctor.fullname}</h4>
                    <span>{doctor.specialization}</span>
                </div>
                <div className={cx('lowerPart')}>
                    <div>
                        <span>
                            <MdEmail className={cx('icon')} />
                            {doctor.email}
                        </span>
                        <span>
                            <FaPhoneAlt className={cx('icon')} />
                            {doctor.phone}
                        </span>
                    </div>
                    <div>
                        <h4>{doctor.timeSlots[0]?.day}</h4>
                        <h4>
                            {convertTime(doctor.timeSlots[0]?.startingTime)} -{' '}
                            {convertTime(doctor.timeSlots[0]?.endingTime)}
                        </h4>{' '}
                    </div>
                </div>
            </div>
        </div>
    );
};

PatientAppointment.propTypes = {
    doctor: PropTypes.object.isRequired,
};

export default PatientAppointment;

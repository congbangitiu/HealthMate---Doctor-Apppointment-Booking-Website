import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FaStar } from 'react-icons/fa';
import InfoToolTip from './../InfoToolTip/InfoToolTip';
import DefaultMaleDoctorAvatar from '../../assets/images/default-male-doctor.png';
import DefaultFemaleDoctorAvatar from '../../assets/images/default-female-doctor.png';

const cx = classNames.bind(styles);

const DoctorCard = ({ doctor }) => {
    const defaultDoctorAvatar = doctor.gender === 'male' ? DefaultMaleDoctorAvatar : DefaultFemaleDoctorAvatar;
    
    return (
        <Link to={`/doctors/${doctor._id}`} className={cx('container')}>
            <img src={doctor.photo || defaultDoctorAvatar} alt="" />
            <h4>Dr. {doctor.fullname}</h4>
            <div className={cx('expertise-rating')}>
                <div className={cx('expertise')}>{doctor.subspecialty}</div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>{doctor.avgRating}</p>
                    <p>({doctor.totalRating})</p>
                </div>
            </div>
            {doctor.totalPatients > 0 && doctor.experiences.length > 0 && (
                <div className={cx('details')}>
                    <p className={cx('patients')}>+{doctor.totalPatients} patients</p>
                    <p className={cx('office')}>
                        <InfoToolTip text={doctor.experiences[0]?.hospital} maxLength={30} />
                    </p>
                </div>
            )}
        </Link>
    );
};

DoctorCard.propTypes = {
    doctor: PropTypes.object.isRequired,
};

export default DoctorCard;

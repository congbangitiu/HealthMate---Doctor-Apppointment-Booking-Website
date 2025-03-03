import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FaStar } from 'react-icons/fa';
import truncateText from './../../utils/truncateText';

const cx = classNames.bind(styles);

const DoctorCard = ({ doctor }) => {
    return (
        <Link to={`/doctors/${doctor._id}`} className={cx('container')}>
            <img src={doctor.photo} alt="" />
            <h4>Dr. {doctor.fullname}</h4>
            <div className={cx('expertise-rating')}>
                <div className={cx('expertise')}>{doctor.specialization}</div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>{doctor.avgRating}</p>
                    <p>({doctor.totalRating})</p>
                </div>
            </div>
            <div className={cx('details')}>
                <p className={cx('patients')}>+{doctor.totalPatients} patients</p>
                <p className={cx('office')}>{truncateText(doctor.experiences[0]?.hospital, 34)}</p>
            </div>
        </Link>
    );
};

DoctorCard.propTypes = {
    doctor: PropTypes.object.isRequired,
};

export default DoctorCard;

import classNames from 'classnames/bind';
import styles from './Doctor.module.scss';
import { FaStar } from 'react-icons/fa';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const Doctor = ({
    smallMode,
    fullname,
    bio,
    averageRating,
    totalRating,
    specialization,
    photo,
}) => {
    return (
        <div className={cx('container')}>
            <img src={photo} alt="" className={cx(smallMode && 'smallImg')} />
            <div className={cx('info', smallMode && 'small')}>
                <div className={cx('name-expertise')}>
                    <h4>Dr. {fullname}</h4>
                    <div className={cx('expertise')}>{specialization}</div>
                </div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>{averageRating}</p>
                    <p>({totalRating})</p>
                </div>
                <p className={cx('description', smallMode && 'small')}>{bio}</p>
            </div>
        </div>
    );
};

Doctor.propTypes = {
    smallMode: PropTypes.bool.isRequired,
    fullname: PropTypes.string.isRequired,
    qualifications: PropTypes.array.isRequired,
    experiences: PropTypes.array.isRequired,
    timeSlots: PropTypes.array.isRequired,
    reviews: PropTypes.array.isRequired,
    bio: PropTypes.string.isRequired,
    about: PropTypes.string.isRequired,
    averageRating: PropTypes.number.isRequired,
    totalRating: PropTypes.number.isRequired,
    specialization: PropTypes.string.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    photo: PropTypes.string.isRequired,
};

export default Doctor;

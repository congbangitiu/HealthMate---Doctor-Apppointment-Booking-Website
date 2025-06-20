import { useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Doctor.module.scss';
import { FaStar } from 'react-icons/fa';
import { PropTypes } from 'prop-types';
import roundNumber from '../../utils/number/roundNumber';
import DefaultMaleDoctorAvatar from '../../assets/images/default-male-doctor.png';
import DefaultFemaleDoctorAvatar from '../../assets/images/default-female-doctor.png';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Doctor = ({ smallMode, fullname, gender, bio, averageRating, totalRating, subspecialty, photo }) => {
    const { t } = useTranslation('tabsDoctor');
    const defaultDoctorAvatar = gender === 'male' ? DefaultMaleDoctorAvatar : DefaultFemaleDoctorAvatar;

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <img src={photo || defaultDoctorAvatar} className={cx(smallMode && 'smallImg')} />
            <div className={cx('info', smallMode && 'small')}>
                <div className={cx('name-expertise')}>
                    <h4>
                        {t('titlePrefix')} {fullname}
                    </h4>
                    <div className={cx('expertise')}>{subspecialty}</div>
                </div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>{roundNumber(averageRating, 1)}</p>
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
    gender: PropTypes.string.isRequired,
    qualifications: PropTypes.array.isRequired,
    experiences: PropTypes.array.isRequired,
    timeSlots: PropTypes.array.isRequired,
    reviews: PropTypes.array.isRequired,
    bio: PropTypes.string.isRequired,
    about: PropTypes.string.isRequired,
    averageRating: PropTypes.number.isRequired,
    totalRating: PropTypes.number.isRequired,
    subspecialty: PropTypes.string.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    photo: PropTypes.string.isRequired,
};

export default Doctor;

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './DoctorCard.module.scss';
import { FaStar } from 'react-icons/fa';
import InfoToolTip from './../InfoToolTip/InfoToolTip';
import DefaultMaleDoctorAvatar from '../../assets/images/default-male-doctor.png';
import DefaultFemaleDoctorAvatar from '../../assets/images/default-female-doctor.png';
import { useTranslation } from 'react-i18next';
import translateSubspecialtyName from '../../utils/translation/translateSubspecialtyName';

const cx = classNames.bind(styles);

const DoctorCard = ({ doctor }) => {
    const { t, i18n } = useTranslation('doctorCard');
    const defaultDoctorAvatar = doctor.gender === 'male' ? DefaultMaleDoctorAvatar : DefaultFemaleDoctorAvatar;

    return (
        <Link to={`/doctors/${doctor._id}`} className={cx('container')}>
            <img src={doctor.photo || defaultDoctorAvatar} alt="" />
            <h4>
                {t('prefix')} {doctor.fullname}
            </h4>
            <div className={cx('expertise-rating')}>
                <div className={cx('expertise')}>{translateSubspecialtyName(doctor.subspecialty, i18n)}</div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>{doctor.avgRating}</p>
                    <p>({doctor.totalRating})</p>
                </div>
            </div>
            <div className={cx('details')}>
                {doctor.totalPatients > 0 && (
                    <p className={cx('patients')}>
                        +{doctor.totalPatients} {t('patients')}
                    </p>
                )}
                {doctor.experiences.length > 0 && (
                    <p className={cx('office')}>
                        <InfoToolTip text={doctor.experiences[0]?.hospital} maxLength={30} />
                    </p>
                )}
            </div>
        </Link>
    );
};

DoctorCard.propTypes = {
    doctor: PropTypes.object.isRequired,
};

export default DoctorCard;

import formatDate from '../../utils/date-time/formatDate';
import classNames from 'classnames/bind';
import styles from './AboutDoctor.module.scss';
import DoctorActivity1 from '../../assets/images/doctor-activity-1.webp';
import DoctorActivity2 from '../../assets/images/doctor-activity-2.jpg';
import { PropTypes } from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const AboutDoctor = ({ fullname, about, qualifications, experiences, hidden }) => {
    const { t } = useTranslation('aboutDoctor');

    return (
        <div className={cx('container')}>
            <div className={cx('activities', hidden && 'hidden')}>
                <img src={DoctorActivity1} alt="" />
                <img src={DoctorActivity2} alt="" />
            </div>
            <div className={cx('content')}>
                <div className={cx('about')}>
                    <h4>
                        {t('title')} <span>{fullname}</span>
                    </h4>
                    <p>{about}</p>
                </div>

                <div className={cx('education')}>
                    <h4>{t('education')}</h4>
                    <div className={cx('education-details')}>
                        {qualifications?.map((qualification, index) => (
                            <div key={index} className={cx('education-detail')}>
                                <p>
                                    {formatDate(qualification.startingDate)} - {formatDate(qualification.endingDate)}
                                </p>
                                <div className={cx('education-location')}>
                                    <p>{qualification.degree}</p>
                                    <p>{qualification.university}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={cx('experience')}>
                    <h4>{t('experience')}</h4>
                    <div className={cx('experience-details')}>
                        {experiences?.map((experience, index) => (
                            <div key={index} className={cx('experience-detail')}>
                                <p>
                                    {formatDate(experience.startingDate)} -{' '}
                                    {experience.endingDate ? formatDate(experience.endingDate) : t('present')}
                                </p>
                                <p>{experience.position}</p>
                                <p>{experience.hospital}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

AboutDoctor.propTypes = {
    fullname: PropTypes.string.isRequired,
    about: PropTypes.string.isRequired,
    qualifications: PropTypes.array.isRequired,
    experiences: PropTypes.array.isRequired,
    hidden: PropTypes.bool.isRequired,
};

export default AboutDoctor;

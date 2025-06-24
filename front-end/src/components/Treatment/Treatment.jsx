import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Treatment.module.scss';
import '../../GlobalStyle.css';
import Doctor5 from '../../assets/images/feature-img.png';
import Avatar from '../../assets/images/avatar-icon.png';
import { FaVideo } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Treatment = () => {
    const { t } = useTranslation('homepage');

    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>{t('treatment.title')}</h2>
                <div className={cx('steps')}>
                    {t('treatment.steps', { returnObjects: true }).map((step, index) => (
                        <p key={index}>
                            {index + 1}. {step}
                        </p>
                    ))}
                </div>
                <Link to={'/doctors'}>
                    <button className={cx('more-details')}>{t('treatment.button')}</button>
                </Link>
            </div>

            <div className={cx('info')}>
                <img src={Doctor5} alt="Doctor consulting online" />
                <div className={cx('card')}>
                    <div className={cx('time')}>
                        <p>Tue, 24</p>
                        <p>10:00 AM</p>
                        <div className={cx('video-wrapper')}>
                            <FaVideo className={cx('video')} />
                        </div>
                    </div>
                    <div className={cx('major')}>Consultation</div>
                    <div className={cx('doctor-info')}>
                        <img src={Avatar} alt="Doctor Avatar" />
                        <p>Wayne Collins</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Treatment;

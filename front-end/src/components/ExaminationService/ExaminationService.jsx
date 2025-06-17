import { useTranslation } from 'react-i18next';
import classNames from 'classnames/bind';
import styles from './ExaminationService.module.scss';
import ExaminationService1 from '../../assets/images/icon01.png';
import ExaminationService2 from '../../assets/images/icon02.png';
import ExaminationService3 from '../../assets/images/icon03.png';

const cx = classNames.bind(styles);

const ExaminationService = () => {
    const { t } = useTranslation('examinationService');

    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>{t('title')}</h2>
                <p>{t('subtitle')}</p>
            </div>
            <div className={cx('services')}>
                <div className={cx('service')}>
                    <img src={ExaminationService1} alt="" />
                    <h4>{t('services.findDoctor.title')}</h4>
                    <p>{t('services.findDoctor.description')}</p>
                </div>
                <div className={cx('service')}>
                    <img src={ExaminationService2} alt="" />
                    <h4>{t('services.findLocation.title')}</h4>
                    <p>{t('services.findLocation.description')}</p>
                </div>
                <div className={cx('service')}>
                    <img src={ExaminationService3} alt="" />
                    <h4>{t('services.bookAppointment.title')}</h4>
                    <p>{t('services.bookAppointment.description')}</p>
                </div>
            </div>
        </div>
    );
};

export default ExaminationService;

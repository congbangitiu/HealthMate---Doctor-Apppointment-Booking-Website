import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './TreatmentService.module.scss';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Treatments from '../../assets/data/mock-data/services';
import useResponsive from '../../hooks/useResponsive';

const cx = classNames.bind(styles);

const TreatmentService = () => {
    const { t } = useTranslation('treatmentService');
    const { isTabletOrMobile: isSmallScreen } = useResponsive();
    const serviceNumberLoaded = isSmallScreen ? 6 : 8;

    const [visibleServices, setVisibleServices] = useState(serviceNumberLoaded);

    const handleLoadMore = () => {
        setVisibleServices((prevCount) => prevCount + serviceNumberLoaded);
    };

    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>{t('heading')}</h2>
                <p>{t('description')}</p>
            </div>
            <div className={cx('services')}>
                {Treatments.slice(0, visibleServices).map((treatment) => (
                    <Link to={`/services/${treatment.id}`} key={treatment.id}>
                        <div className={cx('service')}>
                            <div>
                                <img src={treatment.image} alt={t(`services.${treatment.id}.name`)} />
                            </div>
                            <div>
                                <h4>{t(`services.${treatment.id}.name`)}</h4>
                                <p>{t(`services.${treatment.id}.shortDesc`)}</p>
                            </div>
                            <span>{t('label.viewDetails')} →</span>
                        </div>
                    </Link>
                ))}
            </div>
            {visibleServices < Treatments.length && <button onClick={handleLoadMore}>{t('loadMore')} ...</button>}
        </div>
    );
};

export default TreatmentService;

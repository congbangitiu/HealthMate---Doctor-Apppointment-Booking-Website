import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ServiceDetails.module.scss';
import Treatments from '../../assets/data/mock-data/services';
import DoctorCard from './../../components/DoctorCard/DoctorCard';
import { BASE_URL } from '../../../config';
import useFetchData from '../../hooks/useFetchData';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/Error/Error';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ServiceDetails = () => {
    const { id } = useParams();
    const { t } = useTranslation('treatmentService');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const treatment = Treatments.find((item) => item.id === id);

    const {
        data: doctors,
        loading,
        error,
    } = useFetchData(treatment ? `${BASE_URL}/doctors?subspecialty=${treatment.subspecialty.toLowerCase()}` : null);

    if (!treatment) {
        return (
            <div className={cx('container')}>
                <p className={cx('not-found')}>{t('label.notFound')}</p>
            </div>
        );
    }

    const translation = t(`services.${treatment.id}`, { returnObjects: true });

    const benefits = translation.benefits || [];
    const procedure = translation.procedure || [];
    const requirements = translation.requirements || [];
    const expectedResults = translation.expectedResults || [];

    return (
        <div className={cx('container')}>
            <div className={cx('intro')}>
                <img src={treatment.image} alt={translation.name} />
                <div>
                    <h4>{translation.name}</h4>
                    <p>{translation.longDesc}</p>
                </div>
            </div>

            <div className={cx('info')}>
                <div>
                    <span>{t('label.benefits')}</span>
                    <ul>
                        {benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span>{t('label.procedure')}</span>
                    <ul>
                        {procedure.map((step, index) => (
                            <li key={index}>
                                {index + 1}. {step}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span>{t('label.requirements')}</span>
                    <ul>
                        {requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span>{t('label.expectedResults')}</span>
                    <ul>
                        {expectedResults.map((result, index) => (
                            <li key={index}>{result}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={cx('relevant-doctors')}>
                <h4>{t('label.relevantDoctors')}</h4>
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Error errorMessage={error} />
                ) : doctors.length > 0 ? (
                    <div className={cx('doctors')}>
                        {doctors.map((doctor) => (
                            <DoctorCard key={doctor._id} doctor={doctor} />
                        ))}
                    </div>
                ) : (
                    <p className={cx('no-doctor')}>{t('label.noDoctorMessage')}</p>
                )}
            </div>
        </div>
    );
};

export default ServiceDetails;

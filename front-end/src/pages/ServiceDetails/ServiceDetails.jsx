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

const cx = classNames.bind(styles);

const ServiceDetails = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const { id } = useParams();

    const {
        data: doctors,
        loading,
        error,
    } = useFetchData(`${BASE_URL}/doctors?query=${Treatments[id - 1].doctor.toLowerCase()}`);

    return (
        <div className={cx('container')}>
            <div className={cx('intro')}>
                <img src={Treatments[id - 1].image} alt="" />
                <div>
                    <h4>{Treatments[id - 1].name}</h4>
                    <p>{Treatments[id - 1].longDesc}</p>
                </div>
            </div>
            <div className={cx('info')}>
                <div>
                    <span>Benefits</span>
                    <ul>
                        {Treatments[id - 1].benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span>Procedure</span>
                    <ul>
                        {Treatments[id - 1].procedure.map((step, index) => (
                            <li key={index}>
                                {index + 1}. {step}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span>Requirements</span>
                    <ul>
                        {Treatments[id - 1].requirements.map((requirement, index) => (
                            <li key={index}>{requirement}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span>Expected Results</span>
                    <ul>
                        {Treatments[id - 1].expectedResults.map((result, index) => (
                            <li key={index}>{result}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className={cx('relevant-doctors')}>
                <h4>Relevant Doctors</h4>

                {loading ? (
                    <Loader />
                ) : error ? (
                    <Error errorMessage={error} />
                ) : (
                    <>
                        {doctors.length > 0 ? (
                            <div className={cx('doctors')}>
                                {doctors.map((doctor) => (
                                    <DoctorCard key={doctor._id} doctor={doctor} />
                                ))}
                            </div>
                        ) : (
                            <p className={cx('no-doctor')}>
                                Currently there is no doctor in charge of this service. Thank you for your interest in
                                the service!
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ServiceDetails;

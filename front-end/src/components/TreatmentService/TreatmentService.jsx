import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './TreatmentService.module.scss';
import { IoIosMore } from 'react-icons/io';
import { Link } from 'react-router-dom';

import Treatments from '../../assets/data/services';

const cx = classNames.bind(styles);

const TreatmentService = () => {
    const [visibleServices, setVisibleServices] = useState(6);

    const handleLoadMore = () => {
        setVisibleServices((prevCount) => prevCount + 6);
    };

    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>Offering the best medical treatment services</h2>
                <p>World-class care for everyone. Our health System offers unmatched, expert healthcare</p>
            </div>
            <div className={cx('services')}>
                {Treatments.slice(0, visibleServices).map((treatment) => (
                    <Link to={`/services/${treatment.id}`} key={treatment.id}>
                        <div className={cx('service')}>
                            <img src={treatment.image} alt="" />
                            <h4>{treatment.name}</h4>
                            <p>{treatment.shortDesc}</p>
                        </div>
                    </Link>
                ))}
            </div>
            {visibleServices < Treatments.length && (
                <button onClick={handleLoadMore}>
                    Load more <IoIosMore />
                </button>
            )}
        </div>
    );
};

export default TreatmentService;

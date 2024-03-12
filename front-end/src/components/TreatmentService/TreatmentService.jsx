import React from 'react';
import classNames from 'classnames/bind';
import styles from './TreatmentService.module.scss';
import { FaLongArrowAltRight } from 'react-icons/fa';

import Treatments from '../../assets/data/services';

const cx = classNames.bind(styles);

const TreatmentService = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>Offering the best medical treatment services</h2>
                <p>World-class care for everyone. Our health System offers unmatched, expert healthcare</p>
            </div>
            <div className={cx('services')}>
                {Treatments.map((treatment) => (
                    <div key={treatment.id} className={cx('service')}>
                        <img src={treatment.image} alt="" />
                        <h4>{treatment.name}</h4>
                        <p>{treatment.description}</p>
                        <div className={cx('more-details')}>
                            <p>More details</p>
                            <FaLongArrowAltRight />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TreatmentService;

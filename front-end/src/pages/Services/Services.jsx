import React from 'react';
import classNames from 'classnames/bind';
import styles from './Services.module.scss';

import ExaminationService from '../../components/ExaminationService/ExaminationService';
import TreatmentService from '../../components/TreatmentService/TreatmentService';

const cx = classNames.bind(styles);

const Services = () => {
    return (
        <div className={cx('container')}>
            <ExaminationService />

            <TreatmentService />
        </div>
    );
};

export default Services;

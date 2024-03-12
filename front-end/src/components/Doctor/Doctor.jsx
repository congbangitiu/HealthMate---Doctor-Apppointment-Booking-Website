import React from 'react';
import classNames from 'classnames/bind';
import styles from './Doctor.module.scss';
import { FaStar } from 'react-icons/fa';

import DoctorImg from '../../assets/images/doctor-img01.png';

const cx = classNames.bind(styles);

const Doctor = () => {
    return (
        <div className={cx('container')}>
            <img src={DoctorImg} alt="" />
            <div className={cx('info')}>
                <div className={cx('name-expertise')}>
                    <h4>Muhibur Rahman</h4>
                    <div className={cx('expertise')}>Surgeon</div>
                </div>
                <div className={cx('rating')}>
                    <FaStar className={cx('stars')} />
                    <p>4.8</p>
                    <p>(272)</p>
                </div>
                <p className={cx('description')}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. DICta, aliasi
                </p>
            </div>
        </div>
    );
};

export default Doctor;

import React from 'react';
import classNames from 'classnames/bind';
import styles from './Treatment.module.scss';
import '../../GlobalStyle.css';
import Doctor5 from '../../assets/images/feature-img.png';
import Avatar from '../../assets/images/avatar-icon.png';
import { FaVideo } from 'react-icons/fa6';

const cx = classNames.bind(styles);

const Treatment = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>Get virtual treatment anytime</h2>
                <div className={cx('steps')}>
                    <p>1. Schedule the appointment directly. </p>
                    <p>2. Search for your physician here, and contact their office.</p>
                    <p>
                        3. View our physicians who are accepting new patients, use the online scheduling tool to select
                        an appointment time.
                    </p>
                </div>
                <button className={cx('more-details')}>Learn more</button>
            </div>
            <div className={cx('info')}>
                <img src={Doctor5} alt="" />
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
                        <img src={Avatar} alt="" />
                        <p>Wayne Collins</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Treatment;

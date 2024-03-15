import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorDetails.module.scss';

import Doctor from '../../../components/Doctor/Doctor';
import SidePanel from '../../../components/SidePanel/SidePanel';
import AboutDoctor from '../../../components/AboutDoctor/AboutDoctor';
import FeedbackDoctor from '../../../components/FeedbackDoctor/FeedbackDoctor';

const cx = classNames.bind(styles);

const DoctorDetails = () => {
    const [activeTab, setActiveTab] = useState('about');

    console.log(activeTab);
    return (
        <div className={cx('container')}>
            <div className={cx('doctor-slots')}>
                <Doctor />
                <SidePanel />
            </div>
            <div className={cx('bar')}>
                <div className={cx({ active: activeTab === 'about' })} onClick={() => setActiveTab('about')}>
                    About
                </div>
                <div className={cx({ active: activeTab === 'feedback' })} onClick={() => setActiveTab('feedback')}>
                    Feedback
                </div>
            </div>
            {activeTab === 'about' ? <AboutDoctor /> : <FeedbackDoctor />}
        </div>
    );
};

export default DoctorDetails;

import { useState, useContext, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorDetails.module.scss';

import Doctor from '../../../components/Doctor/Doctor';
import SidePanel from '../../../components/SidePanel/SidePanel';
import AboutDoctor from '../../../components/AboutDoctor/AboutDoctor';
import FeedbackDoctor from '../../../components/FeedbackDoctor/FeedbackDoctor';

import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import { useParams } from 'react-router-dom';
import { authContext } from '../../../context/AuthContext';

const cx = classNames.bind(styles);

const DoctorDetails = () => {
    const [activeTab, setActiveTab] = useState('about');
    const { id } = useParams();
    const { data: doctor, loading, error } = useFetchData(`${BASE_URL}/doctors/${id}`);
    const { role } = useContext(authContext);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container-parent')}>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    <div className={cx('doctor-slots')}>
                        <span>
                            <Doctor {...doctor} />
                        </span>
                        <SidePanel
                            doctorId={doctor._id}
                            ticketPrice={doctor.ticketPrice}
                            timeSlots={doctor.timeSlots}
                            role={role}
                        />
                    </div>
                    <div className={cx('bar')}>
                        <div className={cx({ active: activeTab === 'about' })} onClick={() => setActiveTab('about')}>
                            About
                            <div></div>
                        </div>
                        <div
                            className={cx({ active: activeTab === 'feedback' })}
                            onClick={() => setActiveTab('feedback')}
                        >
                            Feedback
                            <div></div>
                        </div>
                    </div>
                    {activeTab === 'about' ? <AboutDoctor {...doctor} /> : <FeedbackDoctor {...doctor} role={role} />}
                </div>
            )}
        </div>
    );
};

export default DoctorDetails;

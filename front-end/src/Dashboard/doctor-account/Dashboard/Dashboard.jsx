import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Dashboard.module.scss';
import Tabs from '../Tabs/Tabs';

import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import useGetProfile from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';

import { FaCircleExclamation } from 'react-icons/fa6';
import Doctor from '../../../components/Doctor/Doctor';
import AboutDoctor from '../../../components/AboutDoctor/AboutDoctor';
import ProfileSetting from '../ProfileSetting/ProfileSetting';
import Appointments from '../Appointments/Appointments';

const cx = classNames.bind(styles);

const Dashboard = () => {
    const { data: doctorData, loading, error } = useGetProfile(`${BASE_URL}/doctors/profile/me`);
    const [tab, setTab] = useState('overview');

    return (
        <div className={cx('container-parent')}>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('container')}>
                    <Tabs tab={tab} setTab={setTab} doctorData={doctorData} />
                    <div className={cx('information')}>
                        {doctorData.isApproved === 'pending' && (
                            <div className={cx('noti', 'pending')}>
                                <FaCircleExclamation className={cx('icon')} />
                                To get approval please complete your profile. We&apos;ll review manually and accept
                                within 3 days.
                            </div>
                        )}
                        {doctorData.isApproved === 'rejected' && (
                            <div className={cx('noti', 'rejected')}>
                                <FaCircleExclamation className={cx('icon')} />
                                Your account was declined by administrators due to unexpected issues. Please contact
                                them to resolve the matter.
                            </div>
                        )}
                        {tab === 'overview' && (
                            <div>
                                <Doctor
                                    smallMode={true}
                                    fullname={doctorData.fullname}
                                    photo={doctorData.photo}
                                    specialization={doctorData.specialization}
                                    averageRating={doctorData.averageRating}
                                    totalRating={doctorData.totalRating}
                                    bio={doctorData.bio}
                                />
                                <AboutDoctor
                                    fullname={doctorData.fullname}
                                    about={doctorData.about}
                                    qualifications={doctorData.qualifications}
                                    experiences={doctorData.experiences}
                                    hidden={true}
                                />
                            </div>
                        )}
                        {tab === 'appointments' && <Appointments />}
                        {tab === 'setting' && <ProfileSetting doctorData={doctorData} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

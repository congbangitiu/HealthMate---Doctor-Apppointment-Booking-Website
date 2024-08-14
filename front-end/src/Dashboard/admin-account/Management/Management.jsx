import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Management.module.scss';
import Tabs from '../Tabs/Tabs';
import DashboardManagement from '../DashboardManagement/DashboardManagement';
import DoctorManagement from '../DoctorManagement/DoctorManagement';
import PatientManagement from '../PatientManagement/PatientManagement';
import AppointmentManagement from '../AppointmentManagement/AppointmentManagement';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';

const cx = classNames.bind(styles);

const Management = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const {
        data: users,
        loading: userLoading,
        error: userError,
    } = useFetchData(`${BASE_URL}/users?query=${debouncedQuery}`);
    const {
        data: doctors,
        loading: doctorLoading,
        error: doctorError,
    } = useFetchData(`${BASE_URL}/doctors?query=${debouncedQuery}`);
    const { data: appointments } = useFetchData(`${BASE_URL}/bookings`);

    return (
        <div className={cx('container')}>
            <div className={cx('inner')}>
                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} doctors={doctors} />

                <div className={cx('content')}>
                    {activeTab === 'dashboard' && (
                        <DashboardManagement users={users} doctors={doctors} appointments={appointments} />
                    )}
                    {activeTab === 'doctor' && (
                        <DoctorManagement
                            doctors={doctors}
                            setDebouncedQuery={setDebouncedQuery}
                            loading={doctorLoading}
                            error={doctorError}
                        />
                    )}
                    {activeTab === 'patient' && (
                        <PatientManagement
                            users={users}
                            setDebouncedQuery={setDebouncedQuery}
                            loading={userLoading}
                            error={userError}
                        />
                    )}
                    {activeTab === 'appointment' && (
                        <AppointmentManagement doctors={doctors} users={users} appointments={appointments} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Management;

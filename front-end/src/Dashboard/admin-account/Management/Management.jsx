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
    const { data: users } = useFetchData(`${BASE_URL}/users`);
    const { data: doctors } = useFetchData(`${BASE_URL}/doctors`);
    const { data: appointments } = useFetchData(`${BASE_URL}/bookings`);

    return (
        <div className={cx('container')}>
            <div className={cx('inner')}>
                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className={cx('content')}>
                    {activeTab === 'dashboard' && (
                        <DashboardManagement users={users} doctors={doctors} appointments={appointments} />
                    )}
                    {activeTab === 'doctor' && <DoctorManagement />}
                    {activeTab === 'patient' && <PatientManagement />}
                    {activeTab === 'appointment' && <AppointmentManagement />}
                </div>
            </div>
        </div>
    );
};

export default Management;

import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Management.module.scss';
import Tabs from '../Tabs/Tabs';
import DashboardManagement from '../DashboardManagement/DashboardManagement';
import DoctorManagement from '../DoctorManagement/DoctorManagement';
import PatientManagement from '../PatientManagement/PatientManagement';
import AppointmentManagement from '../AppointmentManagement/AppointmentManagement';
import RevenueManagement from '../RevenueManagement/RevenueManagement';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import { Dialog, Slide, Drawer } from '@mui/material';
import useResponsive from '../../../hooks/useResponsive';
import { FaCircleExclamation } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const TABS = ['dashboard', 'doctor', 'patient', 'appointment', 'revenue'];
const DEFAULT_TAB = 'dashboard';

const Management = () => {
    const { t } = useTranslation('management');
    const { isMobile } = useResponsive();
    const { tab } = useParams();
    const navigate = useNavigate();
    const [isShowTab, setIsShowTab] = useState(false);
    const [isShowWarningDevice, setIsShowWarningDevice] = useState(false);
    const activeTab = TABS.includes(tab) ? tab : DEFAULT_TAB;
    const setActiveTab = (nextTab) => navigate(`/admins/management/${nextTab}`);
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

    const STORAGE_KEY = 'managementWarningAccepted';

    useEffect(() => {
        if (isMobile && !localStorage.getItem(STORAGE_KEY)) {
            setIsShowWarningDevice(true);
        } else {
            setIsShowWarningDevice(false);
        }
    }, [isMobile]);

    const handleCloseWarningDialog = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsShowWarningDevice(false);
    };

    useEffect(() => {
        if (!TABS.includes(tab)) {
            navigate(`/admins/management/${DEFAULT_TAB}`, { replace: true });
        }
    }, [tab, navigate]);

    return (
        <div className={cx('container')}>
            {isMobile && (
                <div className={cx('management-mobile-btn')} onClick={() => setIsShowTab(true)}>
                    {t('mobileAccessLabel')} {'>>'}
                </div>
            )}
            <div className={cx('inner')}>
                {!isMobile ? (
                    <Tabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        doctors={doctors}
                        setIsShowTab={setIsShowTab}
                    />
                ) : (
                    <Drawer
                        open={isShowTab}
                        anchor="left"
                        onClose={() => setIsShowTab(false)}
                        sx={{
                            '& .MuiPaper-root': {
                                width: 'max-content',
                            },
                        }}
                    >
                        <Tabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            doctors={doctors}
                            setIsShowTab={setIsShowTab}
                        />
                    </Drawer>
                )}

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
                    {activeTab === 'revenue' && <RevenueManagement doctors={doctors} appointments={appointments} />}
                </div>
            </div>

            {isMobile && (
                <Dialog
                    open={isShowWarningDevice}
                    TransitionComponent={Transition}
                    keepMounted
                    aria-describedby="alert-dialog-slide-description"
                    sx={{
                        '& .MuiPaper-root': {
                            borderRadius: '10px',
                        },
                    }}
                >
                    <div className={cx('warning-devices')}>
                        <FaCircleExclamation className={cx('icon')} />
                        <p>{t('warningDialog.message')}</p>
                        <button onClick={handleCloseWarningDialog}> {t('warningDialog.button')}</button>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default Management;

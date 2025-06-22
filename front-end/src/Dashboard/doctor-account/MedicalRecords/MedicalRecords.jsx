import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './MedicalRecords.module.scss';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import ErrorSign from '../../../components/Error/Error';
import InfoToolTip from '../../../components/InfoToolTip/InfoToolTip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Prescription from '../Prescription/Prescription';
import ExaminationForm from '../ExaminationForm/ExaminationForm';
import ReExaminationAppointment from '../ReExaminationAppointment/ReExaminationAppointment';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const MedicalRecords = () => {
    const { t } = useTranslation('medicalRecords');
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('examination-form');
    const {
        data: appointment,
        loading,
        error,
    } = useFetchData(`${BASE_URL}/doctors/appointments/my-appointments/${id}`);

    const handleChangeTab = (event, newValue) => {
        setActiveTab(newValue);
    };

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <div className={cx('application')}>
                <div className={cx('info')}>
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorSign errorMessage={error} />
                    ) : (
                        <>
                            <img src={appointment?.user?.photo} alt="" />
                            <h1>{appointment?.user?.fullname}</h1>
                            <p>
                                <b>{t('patient.email')}:</b>{' '}
                                <InfoToolTip
                                    text={appointment?.user?.email}
                                    maxLength={20}
                                    customStyle={{ fontSize: '16px', color: 'var(--darkGrayColor)' }}
                                />
                            </p>
                            <p>
                                <b>{t('patient.phone')}:</b> 0{appointment?.user?.phone}
                            </p>
                            {appointment?.user?.dateOfBirth && (
                                <p>
                                    <b>{t('patient.dob')}:</b> {appointment?.user?.dateOfBirth}
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div className={cx('info')}>
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorSign errorMessage={error} />
                    ) : (
                        <>
                            <img src={appointment?.doctor?.photo} alt="" />
                            <h1>
                                {t('doctor.title')} {appointment?.doctor?.fullname}
                            </h1>
                            <p>
                                <b>{t('doctor.email')}:</b>{' '}
                                <InfoToolTip
                                    text={appointment?.doctor?.email}
                                    maxLength={20}
                                    customStyle={{ fontSize: '16px', color: 'var(--darkGrayColor)' }}
                                />
                            </p>
                            <p>
                                <b>{t('doctor.phone')}:</b> 0{appointment?.doctor?.phone}
                            </p>
                        </>
                    )}
                </div>
            </div>
            <section>
                <div className={cx('tabs')}>
                    <Tabs
                        value={activeTab}
                        onChange={handleChangeTab}
                        variant="scrollable"
                        textColor="inherit"
                        indicatorColor="inherit"
                        sx={{
                            '& .MuiTab-root': {
                                color: 'var(--irisBlueColor)',
                                fontSize: '14px',
                                padding: '0',
                                margin: '0 30px 0 0',
                            },
                            '& .Mui-selected': {
                                color: 'var(--irisBlueColor)',
                                fontSize: '14px',
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: 'var(--irisBlueColor)',
                                height: '3px',
                            },
                        }}
                    >
                        <Tab value="examination-form" label={t('tabs.examinationForm')} />
                        <Tab value="prescription" label={t('tabs.prescription')} />
                        <Tab value="re-examination-appointment" label={t('tabs.reExam')} />
                    </Tabs>
                </div>
                {activeTab === 'examination-form' ? (
                    <ExaminationForm appointment={appointment} />
                ) : activeTab === 'prescription' ? (
                    <Prescription />
                ) : (
                    <ReExaminationAppointment />
                )}
            </section>
        </div>
    );
};

export default MedicalRecords;

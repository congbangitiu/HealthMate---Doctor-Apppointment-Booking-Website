import classNames from 'classnames/bind';
import styles from './Tabs.module.scss';
import { BiSolidDashboard } from 'react-icons/bi';
import { FaUserDoctor, FaHospitalUser, FaMoneyBill1Wave } from 'react-icons/fa6';
import { FaCalendarAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Tabs = ({ activeTab, setActiveTab, doctors, setIsShowTab }) => {
    const { t } = useTranslation('management');
    const pendingDoctors = doctors.filter((doctor) => doctor.isApproved === 'pending');

    return (
        <div className={cx('container')}>
            <div
                className={cx('tab', { active: activeTab === 'dashboard' })}
                onClick={() => {
                    setActiveTab('dashboard');
                    setIsShowTab(false);
                }}
            >
                <BiSolidDashboard className={cx('icon')} />
                <h4>
                    <h4>{t('tabs.dashboard')}</h4>
                </h4>
            </div>
            <div
                className={cx('tab', { active: activeTab === 'doctor' })}
                onClick={() => {
                    setActiveTab('doctor');
                    setIsShowTab(false);
                }}
            >
                <FaUserDoctor className={cx('icon')} />
                <h4>
                    <h4>{t('tabs.doctor')}</h4>
                </h4>
                {pendingDoctors.length > 0 && <div className={cx('doctorTab')}>{pendingDoctors.length}</div>}
            </div>
            <div
                className={cx('tab', { active: activeTab === 'patient' })}
                onClick={() => {
                    setActiveTab('patient');
                    setIsShowTab(false);
                }}
            >
                <FaHospitalUser className={cx('icon')} />
                <h4>{t('tabs.patient')}</h4>
            </div>
            <div
                className={cx('tab', { active: activeTab === 'appointment' })}
                onClick={() => {
                    setActiveTab('appointment');
                    setIsShowTab(false);
                }}
            >
                <FaCalendarAlt className={cx('icon')} />
                <h4>{t('tabs.appointment')}</h4>
            </div>
            <div
                className={cx('tab', { active: activeTab === 'revenue' })}
                onClick={() => {
                    setActiveTab('revenue');
                    setIsShowTab(false);
                }}
            >
                <FaMoneyBill1Wave className={cx('icon')} />
                <h4>{t('tabs.revenue')}</h4>
            </div>
        </div>
    );
};

Tabs.propTypes = {
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    doctors: PropTypes.array.isRequired,
    setIsShowTab: PropTypes.bool.isRequired,
};

export default Tabs;

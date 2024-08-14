import classNames from 'classnames/bind';
import styles from './RevenueManagement.module.scss';
import TimeRevenueBarChart from '../Charts/TimeRevenueBarChart/TimeRevenueBarChart';
import DoctorRevenueBarChart from '../Charts/DoctorRevenueBarChart/DoctorRevenueBarChart';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const RevenueManagement = ({ appointments, doctors }) => {
    const calculateRevenue = () => {
        const totalRevenue = appointments.reduce((acc, appointment) => acc + parseFloat(appointment.ticketPrice), 0);
        return totalRevenue;
    };

    const totalRevenue = calculateRevenue();

    return (
        <div className={cx('container')}>
            <h4>Revenue (${totalRevenue})</h4>

            <div className={cx('charts')}>
                <TimeRevenueBarChart />
                <DoctorRevenueBarChart doctors={doctors} />
            </div>
        </div>
    );
};

RevenueManagement.propTypes = {
    doctors: PropTypes.array,
    appointments: PropTypes.array,
};

export default RevenueManagement;
import classNames from 'classnames/bind';
import styles from './MyBookings.module.scss';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import PatientAppointment from '../../../components/PatientAppointment/PatientAppointment';

const cx = classNames.bind(styles);

const MyBookings = () => {
    const { data: appointments, loading, error } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);

    console.log(appointments);
    return (
        <div className={cx('container')}>
            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                !loading &&
                !error && (
                    <div className={cx('appointments')}>
                        {appointments.map((doctor) => (
                            <PatientAppointment key={doctor._id} doctor={doctor} />
                        ))}
                    </div>
                )
            )}

            {!loading && !error && appointments.length === 0 && <h4>You did not book any doctor yet !</h4>}
        </div>
    );
};

export default MyBookings;

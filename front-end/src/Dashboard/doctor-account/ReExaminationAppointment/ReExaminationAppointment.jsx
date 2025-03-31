import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ReExaminationAppointment.module.scss';
import { FaCircleExclamation } from 'react-icons/fa6';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import Loader from '../../../components/Loader/Loader';
import ToggleButton from '../../../components/ToggleButton/ToggleButton';
import ReExaminationAppointmentEdit from '../ReExaminationAppointmentEdit/ReExaminationAppointmentEdit';
import ReExaminationAppointmentView from '../ReExaminationAppointmentView/ReExaminationAppointmentView';

const cx = classNames.bind(styles);

const ReExaminationAppointment = ({ appointment }) => {
    const [toggle, setToggle] = useState(false);
    const [schedule, setSchedule] = useState({
        day: '',
        startingTime: '',
        endingTime: '',
    });

    const { data: prescription, loading } = useFetchData(`${BASE_URL}/prescriptions/${appointment._id}`);

    useEffect(() => {
        if (appointment && appointment.nextAppointmentTimeSlot) {
            setSchedule({
                day: appointment.nextAppointmentTimeSlot.day,
                startingTime: appointment.nextAppointmentTimeSlot.startingTime,
                endingTime: appointment.nextAppointmentTimeSlot.endingTime,
            });
        }
    }, [appointment]);

    return (
        <div className={cx('container')}>
            {appointment.status === 'pending' && (
                <div className={cx('pending-noti')}>
                    <FaCircleExclamation className={cx('icon')} />
                    You can only schedule a follow-up once both the examination form and prescription are available.
                </div>
            )}

            <ToggleButton toggle={toggle} setToggle={setToggle} />

            {loading ? (
                <Loader />
            ) : !toggle ? (
                <ReExaminationAppointmentEdit
                    appointment={appointment}
                    prescription={prescription}
                    schedule={schedule}
                    setSchedule={setSchedule}
                />
            ) : (
                <ReExaminationAppointmentView appointment={appointment} prescription={prescription} />
            )}
        </div>
    );
};

ReExaminationAppointment.propTypes = {
    appointment: PropTypes.object.isRequired,
};

export default ReExaminationAppointment;

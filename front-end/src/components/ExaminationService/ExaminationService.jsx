import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ExaminationService.module.scss';
import { FaLongArrowAltRight } from 'react-icons/fa';
import ExaminationService1 from '../../assets/images/icon01.png';
import ExaminationService2 from '../../assets/images/icon02.png';
import ExaminationService3 from '../../assets/images/icon03.png';

const cx = classNames.bind(styles);

const ExaminationService = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>Providing the best medical examination services</h2>
                <p>Expert care at your fingertips. Our health system connects you with top medical professionals.</p>
            </div>
            <div className={cx('services')}>
                <div className={cx('service')}>
                    <img src={ExaminationService1} alt="" />
                    <h4>Find a Doctor</h4>
                    <p>
                        Comprehensive care, from doctor to diagnosis. Our health system is with you every step of the
                        way.
                    </p>
                </div>
                <div className={cx('service')}>
                    <img src={ExaminationService2} alt="" />
                    <h4>Find a Location</h4>
                    <p>From consultation to care, our health system delivers unmatched expertise, wherever you are.</p>
                </div>
                <div className={cx('service')}>
                    <img src={ExaminationService3} alt="" />
                    <h4>Book an Appointment</h4>
                    <p>
                        Your journey to health starts here. Our system provides expert care from the clinic to the lab.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExaminationService;

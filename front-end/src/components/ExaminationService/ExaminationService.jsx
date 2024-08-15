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
                <p>World-class care for everyone. Our health System offers unmatched, expert healthcare</p>
            </div>
            <div className={cx('services')}>
                <div className={cx('service')}>
                    <img src={ExaminationService1} alt="" />
                    <h4>Find a Doctor</h4>
                    <p>
                        World-class care for everyone. Our health System offers unmatched, expert healthcare. From the
                        lab to the clinic
                    </p>
                    <div>
                        <FaLongArrowAltRight className={cx('arrow-icon')} />
                    </div>
                </div>
                <div className={cx('service')}>
                    <img src={ExaminationService2} alt="" />
                    <h4>Find a Location</h4>
                    <p>
                        World-class care for everyone. Our health System offers unmatched, expert healthcare. From the
                        lab to the clinic
                    </p>
                    <div>
                        <FaLongArrowAltRight className={cx('arrow-icon')} />
                    </div>
                </div>
                <div className={cx('service')}>
                    <img src={ExaminationService3} alt="" />
                    <h4>Book an Appointment</h4>
                    <p>
                        World-class care for everyone. Our health System offers unmatched, expert healthcare. From the
                        lab to the clinic
                    </p>
                    <div>
                        <FaLongArrowAltRight className={cx('arrow-icon')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExaminationService;

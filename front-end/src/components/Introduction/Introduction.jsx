import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Introduction.module.scss';
import Doctor1 from '../../assets/images/hero-img01.png';
import Doctor2 from '../../assets/images/hero-img02.png';
import Doctor3 from '../../assets/images/hero-img03.png';

import CountUp from 'react-countup';

const cx = classNames.bind(styles);

const Statistics = [
    {
        id: 1,
        number: 30,
        character: '+',
        underlineColor: 'var(--yellowColor)',
        discription: 'Years of experience',
    },
    {
        id: 2,
        number: 15,
        character: '+',
        underlineColor: 'var(--purpleColor)',
        discription: 'Clinic location',
    },
    {
        id: 3,
        number: 100,
        character: '%',
        underlineColor: 'var(--irisBlueColor)',
        discription: 'Patient satisfaction',
    },
];

const Introduction = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>We help patients live a healthy, longer life</h2>
                <p>
                    We help patients live a healthy, longer life by providing seamless access to top medical
                    professionals and comprehensive healthcare services. With HealthMate, managing your health and
                    scheduling appointments has never been easier, ensuring you receive the care you need to thrive. Our
                    user-friendly platform empowers you to take control of your well-being, connecting you with trusted
                    doctors and personalized health solutions.
                </p>
                <Link to={'/doctors'}>
                    <button className={cx('request-appointment')}>Schedule a Visit</button>
                </Link>
                <div className={cx('statistics')}>
                    {Statistics.map((item) => (
                        <div key={item.id} className={cx('statistic')}>
                            <div className={cx('number')}>
                                <p>
                                    <CountUp duration={5} end={item.number} />
                                </p>
                                <p>{item.character}</p>
                            </div>
                            <div className={cx('underline')} style={{ backgroundColor: item.underlineColor }}></div>
                            <p>{item.discription}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className={cx('doctor-images')}>
                <img src={Doctor1} alt="Doctor 1" />
                <div>
                    <img src={Doctor2} alt="Doctor 2" />
                    <img src={Doctor3} alt="Doctor 3" />
                </div>
            </div>
        </div>
    );
};

export default Introduction;

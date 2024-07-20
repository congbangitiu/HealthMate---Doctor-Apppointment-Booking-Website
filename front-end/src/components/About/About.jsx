import classNames from 'classnames/bind';
import styles from './About.module.scss';
import Doctor4 from '../../assets/images/about.png';
import Doctor4Card from '../../assets/images/about-card.png';

const cx = classNames.bind(styles);

const About = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('img-wrapper')}>
                <img src={Doctor4} alt="" />
                <img src={Doctor4Card} alt="" />
            </div>
            <div className={cx('content')}>
                <h2>Proud to be one of the nations best</h2>
                <p>
                    Proud to be one of the nation&apos;s best, HealthMate is dedicated to delivering exceptional
                    healthcare services. Our team of highly qualified doctors and healthcare professionals are committed
                    to providing the highest standard of care to every patient.
                    <br />
                    <br />
                    At HealthMate, we continually strive for excellence in all aspects of patient care. Our innovative
                    platform and cutting-edge technology ensure that you receive the best possible healthcare
                    experience, making us a trusted name in the industry.
                </p>
                <button className={cx('more-details')}>Learn more</button>
            </div>
        </div>
    );
};

export default About;

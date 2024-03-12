import React from 'react';
import classNames from 'classnames/bind';
import styles from './About.module.scss';
import '../../GlobalStyle.css';
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
                    For 30 years in a row, U.S. News & Wyorld Report has recognized us as one of the best publics
                    hospitals in the Nation and #1 in Texas. Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Quas, nemo? <br />
                    <br />
                    Our best is something we strive for each day, caring for our patients-not looking back at what we
                    accomplished but towards what we can do tomorrow. Providing the best. Lorem ipsum dolor sit amet,
                    consectetur adipisicing elit. Aliquid, modi?
                </p>
                <button className={cx('more-details')}>Learn more</button>
            </div>
        </div>
    );
};

export default About;

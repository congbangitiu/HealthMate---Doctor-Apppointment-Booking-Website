import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import '../../GlobalStyle.css';

import Introduction from '../../components/Introduction/Introduction';
import About from '../../components/About/About';
import Treatment from '../../components/Treatment/Treatment';
import FAQ from '../../components/FAQ/FAQ';
import Testimonial from '../../components/Testimonial/Testimonial';

const cx = classNames.bind(styles);

const Home = () => {
    return (
        <div className={cx('container')}>
            {/* Introduction section */}
            <Introduction />

            {/* About section */}
            <About />

            {/* Treatement section */}
            <Treatment />

            {/* FAQ section */}
            <FAQ />

            {/* Testimonial section */}
            <Testimonial />
        </div>
    );
};

export default Home;

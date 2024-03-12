import React from 'react';
import classNames from 'classnames/bind';
import styles from './Layout.module.scss';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Routers from '../routes/Routers';

const cx = classNames.bind(styles);

const Layout = () => {
    return (
        <div className={cx('container')}>
            <Header />
            <main>
                <Routers />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;

import { useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './CheckoutSuccess.module.scss';
import { MdDone } from 'react-icons/md';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const cx = classNames.bind(styles);

const CheckoutSuccess = () => {
    useEffect(() => {
        // Shoot from the left towards the center
        confetti({
            particleCount: 200,
            angle: 60,
            spread: 60,
            origin: { x: 0.2, y: 0.6 }, // The point starts at 20% of the width and is in the middle of the screen's height
        });

        // Shoot from the right towards the center
        confetti({
            particleCount: 200,
            angle: 120,
            spread: 60,
            origin: { x: 0.8, y: 0.6 }, // The point starts at 80% of the width and at the middle of the screen's height
        });
    }, []);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <div className={cx('icon-wrapper')}>
                <MdDone className={cx('icon')} />
            </div>
            <h1>Your booking is comfirmed!</h1>
            <p>Thanks for choosing HeathMate. We hope to see you soon!</p>
            <p>
                <b>Notice:</b> Please be on time!
            </p>
            <Link to="/home" className={cx('back-to-home-btn')}>
                Back to home page
            </Link>
        </div>
    );
};

export default CheckoutSuccess;

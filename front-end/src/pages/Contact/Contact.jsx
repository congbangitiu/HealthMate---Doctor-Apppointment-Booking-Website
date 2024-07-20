import { useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Contact.module.scss';

const cx = classNames.bind(styles);

const Contact = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <h2>Contact Us</h2>
            <p>Got a technical issue? Want to send feedback about a beta feature? Let us know</p>
            <form action="">
                <div className={cx('fields')}>
                    <div className={cx('info')}>
                        <label htmlFor="fullname">Fullname</label>
                        <input type="text" id="fullname" placeholder="Enter your fullname" />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="email">Email</label>
                        <input type="text" id="email" placeholder="Enter your email" />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="phone">Phone No.</label>
                        <input type="text" id="phone" placeholder="Enter your phone number" />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="subject">Subject</label>
                        <input type="text" id="subject" placeholder="Let us know how we can help you" />
                    </div>
                </div>
                <div className={cx('message')}>
                    <label htmlFor="message">Your issue</label>
                    <textarea id="message" cols="30" rows="6" placeholder="Write your problem in detail here ..." />
                </div>
                <div className={cx('submit-btn-wrapper')}>
                    <button className={cx('submit-btn')}>Submit</button>
                </div>
            </form>
        </div>
    );
};

export default Contact;

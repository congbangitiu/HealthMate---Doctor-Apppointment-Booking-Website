import React from 'react';
import classNames from 'classnames/bind';
import styles from './Prescription.module.scss';
import Logo from '../../../assets/images/logo.png';
import Watermark from '../../../assets/images/watermark20.png';
import Signature from '../../../assets/images/signature.png';
import { FaRegTrashAlt } from 'react-icons/fa';

const cx = classNames.bind(styles);

const Prescription = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('application')}>
                <div className={cx('info')}>
                    <img src="https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg" alt="" />
                    <h1>Nguyen Luan Cong Bang</h1>
                    <p>
                        <b>Email:</b> congbang0711@gmail.com
                    </p>
                    <p>
                        <b>Phone number:</b> (+84) 908891201
                    </p>
                    <p>
                        <b>Date of birth:</b> 07-11-2002
                    </p>
                </div>
                <div className={cx('info')}>
                    <img src="https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg" alt="" />
                    <h1>Dr. John Smith</h1>
                    <p>
                        <b>Email:</b> congbang0711@gmail.com
                    </p>
                    <p>
                        <b>Phone number:</b> (+84) 908891201
                    </p>
                    <p>
                        <b>Date of birth:</b> 07-11-2002
                    </p>
                </div>
            </div>

            <div className={cx('prescription')}>
                <div className={cx('brand')}>
                    <img src={Logo} alt="" />
                    <div>
                        <h4>HEALTHMATE</h4>
                        <p>Your Wellness - Our Priority</p>
                    </div>
                </div>
                <h1>PRESCRIPTION</h1>
                <div className={cx('patient-info')}>
                    <p>
                        <b>Patient&apos;s full name:</b> Pham Minh Vu
                    </p>
                    <span>
                        <p>
                            <b>Date of birth:</b> 10-11-2002
                        </p>
                        <p>
                            <b>Gender:</b> Male
                        </p>
                    </span>
                    <span>
                        <p>
                            <b>Address:</b> District 3
                        </p>
                        <p>
                            <b>Phone number:</b> 0123456789
                        </p>
                    </span>
                    <div className={cx('disease')}>
                        <b>Disease:</b>
                        <input type="text" required />
                    </div>
                    <div className={cx('medications')}>
                        <div className={cx('medication')}>
                            <div>
                                <div>
                                    <p>1.</p>
                                    <p>Name of medicine: </p>
                                    <input type="text" required />
                                </div>
                                <div>
                                    <p>Take</p>
                                    <input type="number" required />
                                    <p>tablet(s) </p>
                                    <input type="number" required />
                                    <p>time(s) a day</p>
                                </div>
                            </div>
                            <div className={cx('delete')}>
                                <FaRegTrashAlt className={cx('icon')} />
                                <p className={cx('text')}>Delete</p>
                            </div>
                        </div>

                        <button>Add medication</button>
                        <h4>Total types of medication: 3</h4>
                    </div>
                </div>
                <div className={cx('confirmation')}>
                    <div>
                        <h4>HealthMate, July 27, 2024</h4>
                        <span>
                            <img src={Watermark} alt="" />
                            <img src={Signature} alt="" />
                        </span>
                        <p>John Smith</p>
                        <button>Add signature</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Prescription;

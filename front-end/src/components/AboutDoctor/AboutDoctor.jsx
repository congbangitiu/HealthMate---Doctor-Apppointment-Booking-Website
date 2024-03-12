import React from 'react';
import formatDate from '../../utils/formatDate';
import classNames from 'classnames/bind';
import styles from './AboutDoctor.module.scss';
import DoctorActivity1 from '../../assets/images/doctor-activity-1.webp';
import DoctorActivity2 from '../../assets/images/doctor-activity-2.jpg';

const cx = classNames.bind(styles);

const AboutDoctor = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('activities')}>
                <img src={DoctorActivity1} alt="" />
                <img src={DoctorActivity2} alt="" />
            </div>
            <div className={cx('content')}>
                <div className={cx('about')}>
                    <h4>About of Nazmul Islam</h4>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis eius assumenda corrupti at fugiat
                        ipsum odio laudantium quisquam veritatis consectetur velit illo ullam animi necessitatibus vero
                        voluptatum fuga consequuntur, aspernatur perspiciatis adipisci. Necessitatibus et non sapiente
                        sit distinctio, repellat illo totam perspiciatis, inventore ex assumenda odit natus cumque saepe
                        nostrum?
                    </p>
                </div>
                <div className={cx('education')}>
                    <h4>Education</h4>
                    <div className={cx('education-details')}>
                        <div className={cx('education-detail')}>
                            <p>
                                {formatDate('09-13-2014')} - {formatDate('09-13-2016')}
                            </p>
                            <div className={cx('education-location')}>
                                <p>PhD in Surgeon</p>
                                <p>New Apollo Hospital, New York</p>
                            </div>
                        </div>
                    </div>
                    <div className={cx('education-details')}>
                        <div className={cx('education-detail')}>
                            <p>
                                {formatDate('09-13-2014')} - {formatDate('09-13-2016')}
                            </p>
                            <div className={cx('education-location')}>
                                <p>PhD in Surgeon</p>
                                <p>New Apollo Hospital, New York</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={cx('experience')}>
                    <h4>Experience</h4>
                    <div className={cx('experience-details')}>
                        <div className={cx('experience-detail')}>
                            <p>
                                {formatDate('06-04-2014')} - {formatDate('08-12-2016')}
                            </p>
                            <p>Sr.Surgeon</p>
                            <p>New Apollo Hospital, New York</p>
                        </div>
                        <div className={cx('experience-detail')}>
                            <p>
                                {formatDate('06-04-2014')} - {formatDate('08-12-2016')}
                            </p>
                            <p>Sr.Surgeon</p>
                            <p>New Apollo Hospital, New York</p>
                        </div>
                        <div className={cx('experience-detail')}>
                            <p>
                                {formatDate('06-04-2014')} - {formatDate('08-12-2016')}
                            </p>
                            <p>Sr.Surgeon</p>
                            <p>New Apollo Hospital, New York</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className={cx('relevant-videos')}>
                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/XY2TKYS9Chs?si=gRh3QvzBohzYnw3u"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                />
                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/F4Ll2z4E3-s?si=bYlrsoalg3ch-9_X"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                />
            </div> */}
        </div>
    );
};

export default AboutDoctor;

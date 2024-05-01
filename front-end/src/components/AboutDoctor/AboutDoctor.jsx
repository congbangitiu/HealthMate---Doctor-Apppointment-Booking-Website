import React from 'react';
import formatDate from '../../utils/formatDate';
import classNames from 'classnames/bind';
import styles from './AboutDoctor.module.scss';
import DoctorActivity1 from '../../assets/images/doctor-activity-1.webp';
import DoctorActivity2 from '../../assets/images/doctor-activity-2.jpg';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const AboutDoctor = ({ fullname, about, qualifications, experiences, hidden }) => {
    return (
        <div className={cx('container')}>
            <div className={cx('activities', hidden && 'hidden')}>
                <img src={DoctorActivity1} alt="" />
                <img src={DoctorActivity2} alt="" />
            </div>
            <div className={cx('content')}>
                <div className={cx('about')}>
                    <h4>
                        About of <span>{fullname}</span>
                    </h4>
                    <p>{about}</p>
                </div>
                <div className={cx('education')}>
                    <h4>Education</h4>
                    <div className={cx('education-details')}>
                        {qualifications?.map((qualification, index) => (
                            <div key={index} className={cx('education-detail')}>
                                <p>
                                    {formatDate(qualification.startingDate)} - {formatDate(qualification.endingDate)}
                                </p>
                                <div className={cx('education-location')}>
                                    <p>{qualification.degree}</p>
                                    <p>{qualification.university}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={cx('experience')}>
                    <h4>Experience</h4>

                    <div className={cx('experience-details')}>
                        {experiences?.map((experience, index) => (
                            <div key={index} className={cx('experience-detail')}>
                                <p>
                                    {formatDate(experience.startingDate)} - {formatDate(experience.endingDate)}
                                </p>
                                <p>{experience.position}</p>
                                <p>{experience.hospital}</p>
                            </div>
                        ))}
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

AboutDoctor.propTypes = {
    fullname: PropTypes.string.isRequired,
    about: PropTypes.string.isRequired,
    qualifications: PropTypes.array.isRequired,
    experiences: PropTypes.array.isRequired,
    hidden: PropTypes.bool.isRequired,
};

export default AboutDoctor;

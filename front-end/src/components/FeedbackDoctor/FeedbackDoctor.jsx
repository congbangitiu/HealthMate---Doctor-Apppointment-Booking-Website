import React, { useState } from 'react';
import formatDate from '../../utils/formatDate';
import classNames from 'classnames/bind';
import styles from './FeedbackDoctor.module.scss';
import UserAvatar from '../../assets/images/avatar-icon.png';
import { HiStar } from 'react-icons/hi';
import { SlLike, SlDislike } from 'react-icons/sl';
import FormFeedback from '../FormFeedback/FormFeedback';

const cx = classNames.bind(styles);

const FeedbackDoctor = () => {
    const [showFormFeedback, setShowFormFeedback] = useState(false);

    return (
        <div className={cx('container')}>
            <div className={cx('intro')}>
                <h4>All reviews (272)</h4>
                <div className={cx('filter')}>
                    <label htmlFor="priorities">Filtered by: </label>
                    <select name="" id="priorities">
                        <option value="">Newest</option>
                        <option value="">Oldest</option>
                        <option value="">Favourite</option>
                    </select>
                </div>
            </div>

            <div className={cx('feedback')}>
                <div className={cx('user')}>
                    <img src={UserAvatar} alt="" />
                    <div className={cx('details')}>
                        <div className={cx('name-time')}>
                            <p className={cx('name')}>Ali ahmed</p>
                            <p className={cx('time')}>{formatDate('02-14-2023')}</p>
                        </div>
                        <div className={cx('rating')}>
                            <HiStar className={cx('star')} />
                            <HiStar className={cx('star')} />
                            <HiStar className={cx('star')} />
                            <HiStar className={cx('star')} />
                            <HiStar className={cx('star')} />
                        </div>
                        <p className={cx('comment')}>Good services, highly recommended 👍 </p>
                        <div className={cx('reaction')}>
                            <div className={cx('react')}>
                                <SlLike />
                                <p>Like</p>
                            </div>
                            <div className={cx('react')}>
                                <SlDislike />
                                <p>Dislike</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!showFormFeedback && (
                <div className={cx('feedback-btn-wrapper')}>
                    <button className={cx('feedback-btn')} onClick={() => setShowFormFeedback(true)}>
                        Give your feedback
                    </button>
                </div>
            )}

            {showFormFeedback && (
                <div>
                    <div className={cx('overlay')} onClick={() => setShowFormFeedback(false)}></div>
                    <div className={cx('form-feedback')}>
                        <FormFeedback setShowFormFeedback={setShowFormFeedback} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackDoctor;

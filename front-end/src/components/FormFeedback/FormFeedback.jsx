import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './FormFeedback.module.scss';
import { HiStar } from 'react-icons/hi';
import { IoMdClose } from "react-icons/io";

const cx = classNames.bind(styles);

const FormFeedback = ({setShowFormFeedback}) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [reviewText, setReviewText] = useState('');

    const handleSubmitReview = async (e) => {
        e.preventDefault();
    };

    return (
        <form className={cx('container')} action="">
            <div className={cx('close-icon-wrapper')} onClick={() => setShowFormFeedback(false)}>
                <IoMdClose className={cx('close-icon')}/>
            </div>
            <h1>FEEDBACK</h1>
            <div className={cx('voting')}>
                <h4 className={cx('question')}>How would you rate the overall experience ?</h4>
                <div>
                    {[...Array(5).keys()].map((_, index) => {
                        index += 1;

                        return (
                            <button
                                key={index}
                                className={cx({
                                    active: index <= (rating || hover),
                                    disabled: index > (rating || hover),
                                })}
                                onClick={() => setRating(index)}
                                onMouseEnter={() => setHover(index)}
                                onMouseLeave={() => setHover(rating)}
                                onDoubleClick={() => {
                                    setHover(0);
                                    setRating(0);
                                }}
                            >
                                <HiStar className={cx('star')} />
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={cx('suggestion')}>
                <h4 className={cx('question')}>Share your feedback or suggestion</h4>
                <textarea
                    id=""
                    rows="5"
                    placeholder="Write your feedback or suggestion here"
                    onChange={(e) => setReviewText(e.target.value)}
                />
            </div>

            <button type="submit" className={cx('submit-btn')} onClick={handleSubmitReview}>
                Submit feedback
            </button>
        </form>
    );
};

export default FormFeedback;

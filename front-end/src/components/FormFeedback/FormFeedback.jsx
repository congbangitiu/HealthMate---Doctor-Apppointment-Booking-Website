import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './FormFeedback.module.scss';
import { HiStar } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { PropTypes } from 'prop-types';
import { useParams } from 'react-router-dom';
import { BASE_URL, token } from '../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';

const cx = classNames.bind(styles);

const FormFeedback = ({ setShowFormFeedback }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);
    const { id } = useParams();

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setLoading(true);

        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        try {
            if (!rating || !reviewText) {
                setLoading(false);
                return toast.error('Please fill in all fields');
            }

            const res = await fetch(`${BASE_URL}/doctors/${id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ rating, reviewText }),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message);
            }
            setLoading(false);
            toast.success(result.message);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            setLoading(false);
            toast.error(error.message);
        }
    };

    return (
        <form className={cx('container')} action="">
            <div className={cx('close-icon-wrapper')} onClick={() => setShowFormFeedback(false)}>
                <IoMdClose className={cx('close-icon')} />
            </div>
            <h1>FEEDBACK</h1>
            <div className={cx('voting')}>
                <h4 className={cx('question')}>How would you rate the overall experience ?</h4>
                <div>
                    {[...Array(5).keys()].map((_, index) => {
                        index += 1;

                        return (
                            <button
                                type="button"
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
                {loading ? <SyncLoader size={6} color="#ffffff" /> : 'Submit feedback'}
            </button>
        </form>
    );
};

FormFeedback.propTypes = {
    setShowFormFeedback: PropTypes.func.isRequired,
};

export default FormFeedback;

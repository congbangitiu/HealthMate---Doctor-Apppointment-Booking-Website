import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import formatDate from '../../utils/formatDate';
import { BASE_URL, token } from '../../../config';
import classNames from 'classnames/bind';
import styles from './FeedbackDoctor.module.scss';
import { HiStar } from 'react-icons/hi';
import { SlLike, SlDislike } from 'react-icons/sl';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import FormFeedback from '../FormFeedback/FormFeedback';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const FeedbackDoctor = ({ reviews, totalRating, role }) => {
    const [showFormFeedback, setShowFormFeedback] = useState(false);
    const [usersInfo, setUsersInfo] = useState({});
    const [sortCriteria, setSortCriteria] = useState('Newest');
    const [sortedReviews, setSortedReviews] = useState([]);

    const fetchUserData = async (userId) => {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return response.json();
    };

    const handleSortChange = (e) => {
        setSortCriteria(e.target.value);
    };

    useEffect(() => {
        reviews.forEach(async (review) => {
            if (!usersInfo[review.user._id]) {
                try {
                    const userInfo = await fetchUserData(review.user._id);
                    setUsersInfo((prev) => ({ ...prev, [review.user._id]: userInfo }));
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            }
        });
    }, [reviews, usersInfo]);

    useEffect(() => {
        let sorted = [...reviews];
        if (sortCriteria === 'Newest') {
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortCriteria === 'Oldest') {
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortCriteria === 'Most Favourite') {
            sorted.sort((a, b) => b.rating - a.rating);
        }
        setSortedReviews(sorted);
    }, [reviews, sortCriteria]);

    return (
        <div className={cx('container')}>
            <div className={cx('intro')}>
                <h4>All reviews ({totalRating})</h4>
                <div className={cx('sort')}>
                    <label htmlFor="priorities">Sorted by: </label>
                    <select name="" id="priorities" value={sortCriteria} onChange={handleSortChange}>
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                        <option value="Most Favourite">Most Favourite</option>
                    </select>
                </div>
            </div>

            <div className={cx('feedback')}>
                {sortedReviews.map((review, index) => (
                    <div key={index} className={cx('user')}>
                        <img src={review?.user?.photo} alt="" />
                        <div className={cx('details')}>
                            <div className={cx('name-time')}>
                                <p className={cx('name')}>
                                    {usersInfo[review.user._id]?.data.fullname || 'Loading...'}
                                </p>
                                <p className={cx('time')}>{formatDate(review?.createdAt)}</p>
                            </div>
                            <div className={cx('rating')}>
                                {[...Array(review?.rating).keys()].map((_, index) => (
                                    <HiStar key={index} className={cx('star')} />
                                ))}
                            </div>
                            <p className={cx('comment')}>{review?.reviewText}</p>
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
                ))}
            </div>

            {!showFormFeedback && role === 'patient' && (
                <div className={cx('feedback-btn-wrapper')}>
                    <button className={cx('feedback-btn')} onClick={() => setShowFormFeedback(true)}>
                        Give your feedback
                    </button>
                </div>
            )}

            <Dialog
                open={showFormFeedback}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowFormFeedback(false)}
                aria-describedby="alert-dialog-slide-description"
            >
                <div className={cx('form-feedback')}>
                    <FormFeedback setShowFormFeedback={setShowFormFeedback} />
                </div>
            </Dialog>
        </div>
    );
};

FeedbackDoctor.propTypes = {
    reviews: PropTypes.array.isRequired,
    totalRating: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
};

export default FeedbackDoctor;

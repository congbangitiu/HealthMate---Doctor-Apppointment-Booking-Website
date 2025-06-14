import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../utils/services/firebase';
import { toast } from 'react-toastify';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { BASE_URL } from '../../../config';
import classNames from 'classnames/bind';
import styles from './CompleteSignUp.module.scss';
import { MdDone } from 'react-icons/md';

const cx = classNames.bind(styles);

const CompleteSignUp = () => {
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const completeSignIn = async () => {
            try {
                const emailLink = window.location.href;
                if (isSignInWithEmailLink(auth, emailLink)) {
                    let email = window.localStorage.getItem('emailForSignIn');
                    if (!email) {
                        email = window.prompt('Please provide your email for confirmation');
                    }

                    if (email) {
                        const result = await signInWithEmailLink(auth, email, emailLink);
                        window.localStorage.removeItem('emailForSignIn');

                        const formData = JSON.parse(window.localStorage.getItem('formData'));
                        window.localStorage.removeItem('formData');

                        if (result.user) {
                            const response = await fetch(`${BASE_URL}/auth/register`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    ...formData,
                                    uid: result.user.uid,
                                }),
                            });

                            if (response.ok) {
                                toast.success('Account creation successful');
                                setTimeout(() => {
                                    navigate('/login');
                                }, 3000);
                            }
                        }
                    } else {
                        toast.error('Email is required for sign-in');
                        setLoading(false);
                    }
                } else {
                    toast.error('Invalid sign-in link');
                    setLoading(false);
                }
            } catch (warning) {
                toast.info('Please login to access website');
                setLoading(false);
            }
        };

        completeSignIn();
    }, [location, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={cx('container')}>
            <div className={cx('icon-wrapper')}>
                <MdDone className={cx('icon')} />
            </div>
            <h4>Account creation completed! Redirecting to Login page in 3s ...</h4>
        </div>
    );
};

export default CompleteSignUp;

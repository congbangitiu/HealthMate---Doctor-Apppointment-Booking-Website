import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../utils/firebase';
import { toast } from 'react-toastify';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { BASE_URL } from '../../../config';

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
                            } else {
                                const errorData = await response.json();
                                console.log(errorData);
                                toast.error('Error saving user to database');
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
            } catch (error) {
                toast.error('Error during sign-in');
                setLoading(false);
            }
        };

        completeSignIn();
    }, [location, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <div>Account creation completed! Redirecting to Sign In page...</div>;
};

export default CompleteSignUp;

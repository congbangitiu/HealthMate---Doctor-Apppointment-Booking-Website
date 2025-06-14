import { initializeApp } from 'firebase/app';

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
} from 'firebase/auth';

const API_KEY = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_API_KEY;
const AUTH_DOMAIN = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const MESSAGE_SENDER_ID = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID;
const APP_ID = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_APP_ID;
const MEASUREMENT_ID = import.meta.env.VITE_REACT_PUBLIC_FIREBASE_MEASUREMENT_ID;

const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: AUTH_DOMAIN,
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET,
    messagingSenderId: MESSAGE_SENDER_ID,
    appId: APP_ID,
    measurementId: MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export {
    auth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
};
export default app;

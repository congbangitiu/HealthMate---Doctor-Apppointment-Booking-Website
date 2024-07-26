import { initializeApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDSeLycpa6gTm30g6uVC2Q_LcOXhYBHDIE",
    authDomain: "healthmate-otp.firebaseapp.com",
    projectId: "healthmate-otp",
    storageBucket: "healthmate-otp.appspot.com",
    messagingSenderId: "710119342527",
    appId: "1:710119342527:web:937ba628873d5e4b44e10a",
    measurementId: "G-89G2QSCPQ7"
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

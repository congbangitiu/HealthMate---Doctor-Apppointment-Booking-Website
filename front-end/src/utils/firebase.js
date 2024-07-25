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
    apiKey: 'AIzaSyDr6iK5lOJ3E3_9IHzH-bm2hMfIoJ7n0rA',
    authDomain: 'healthmate-974aa.firebaseapp.com',
    projectId: 'healthmate-974aa',
    storageBucket: 'healthmate-974aa.appspot.com',
    messagingSenderId: '414515249099',
    appId: '1:414515249099:web:17710123404b0f2da1004e',
    measurementId: 'G-EESHJ151T6',
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

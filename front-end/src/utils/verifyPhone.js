import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDr6iK5lOJ3E3_9IHzH-bm2hMfIoJ7n0rA",
    authDomain: "healthmate-974aa.firebaseapp.com",
    projectId: "healthmate-974aa",
    storageBucket: "healthmate-974aa.appspot.com",
    messagingSenderId: "414515249099",
    appId: "1:414515249099:web:17710123404b0f2da1004e",
    measurementId: "G-EESHJ151T6"
  };

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export default firebase;
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { useMediaQuery } from '@mui/material';
import './utils/services/i18n.js';

const ToastWrapper = () => {
    const isMobile = useMediaQuery('(max-width:768px)');

    return (
        <ToastContainer
            theme="dark"
            autoClose={3000}
            closeOnClick
            pauseOnHover={false}
            style={{
                position: 'fixed',
                top: !isMobile ? '105px' : '60px',
                right: '3px',
                zIndex: 9999,
            }}
        />
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthContextProvider>
                <ToastWrapper />
                <App />
            </AuthContextProvider>
        </BrowserRouter>
    </React.StrictMode>,
);

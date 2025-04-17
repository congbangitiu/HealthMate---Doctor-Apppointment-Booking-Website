import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Layout.module.scss';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Routers from '../routes/Routers';
import ChatbotAI from '../components/ChatbotAI/ChatbotAI';
import ChatbotLogo from '../assets/images/Chatbot-Logo.png';
import ChatIcon from '../assets/images/chat-icon.svg';
import { FaPlus } from 'react-icons/fa6';
import { FaChevronUp } from 'react-icons/fa';
import { Drawer, useMediaQuery } from '@mui/material';

const cx = classNames.bind(styles);

const Layout = () => {
    const isMobile = useMediaQuery('(max-width:768px)');
    const [isHovered, setIsHovered] = useState(false);
    const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []); // Memoize user
    const [isShowChatbot, setIsShowChatbot] = useState(false);

    // Handle hover effect when the user hovers over the plus icon
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    // Remove hover effect when the user leaves the plus icon
    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div className={cx('container')}>
            <Header />

            <main>
                <Routers />

                <div className={cx('fab-container')}>
                    {!isShowChatbot && (
                        <div
                            className={cx('up-btn', { hidden: isHovered })}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <FaChevronUp className={cx('icon')} />
                        </div>
                    )}
                    {user ? (
                        <div className={cx('modes-wrapper', { hovered: isHovered })} onMouseLeave={handleMouseLeave}>
                            <div className={cx('fab-button', { rotate: isHovered })} onMouseEnter={handleMouseEnter}>
                                <FaPlus className={cx('icon')} />
                            </div>

                            <div className={cx('fab-options')}>
                                <Link to="/chats" className={cx('icon-wrapper')}>
                                    <img src={ChatIcon} alt="Chat icon" />
                                </Link>
                                <div className={cx('icon-wrapper')} onClick={() => setIsShowChatbot(!isShowChatbot)}>
                                    <img src={ChatbotLogo} alt="Chatbot logo" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={cx('chatbot-icon-wrapper')} onClick={() => setIsShowChatbot(!isShowChatbot)}>
                            <img src={ChatbotLogo} alt="Chatbot logo" />
                        </div>
                    )}
                </div>

                {!isMobile ? (
                    <div className={cx('chatbot-wrapper', { show: isShowChatbot })}>
                        <ChatbotAI setIsShowChatbot={setIsShowChatbot} />
                    </div>
                ) : (
                    <Drawer
                        open={isShowChatbot}
                        anchor="bottom"
                        sx={{
                            '& .MuiPaper-root': {
                                width: '100%',
                                height: '100%',
                            },
                        }}
                    >
                        <ChatbotAI setIsShowChatbot={setIsShowChatbot} />
                    </Drawer>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Layout;

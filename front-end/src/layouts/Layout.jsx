import { useState, useEffect, useCallback, useContext } from 'react';
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
import { BASE_URL } from '../../config';
import { authContext } from '../context/AuthContext';
import socket from '../utils/services/socket';

const cx = classNames.bind(styles);

// Create a single global socket instance

const Layout = () => {
    const { user } = useContext(authContext);
    const isMobile = useMediaQuery('(max-width:768px)');
    const [isHovered, setIsHovered] = useState(false);
    const [isShowChatbot, setIsShowChatbot] = useState(false);
    const [chats, setChats] = useState([]);

    useEffect(() => {
        const fetchChats = async () => {
            const res = await fetch(`${BASE_URL}/chats/user-chats/${user?._id}`);
            const data = await res.json();
            setChats(data);
        };

        if (user?._id) {
            fetchChats();
        }
    }, [user?._id]);

    // Handle hover effect when the user hovers over the plus icon
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    // Remove hover effect when the user leaves the plus icon
    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleNewMessage = useCallback(
        (message) => {
            const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
            if (senderId !== user._id) {
                setChats((prevChats) =>
                    prevChats.map((chat) => {
                        if (chat._id === message.chatId) {
                            const updatedChat = { ...chat };
                            const prevCount = updatedChat.unreadMessages?.[user._id] || 0;
                            updatedChat.unreadMessages = {
                                ...updatedChat.unreadMessages,
                                [user._id]: prevCount + 1,
                            };
                            return updatedChat;
                        }
                        return chat;
                    }),
                );
            }
        },
        [user?._id],
    );

    const handleUnreadMessagesUpdated = useCallback(
        ({ chatId, unreadMessages }) => {
            console.log(`Unread messages updated for chat ${chatId}:`, unreadMessages);

            setChats((prevChats) =>
                prevChats.map((chat) => (chat._id === chatId ? { ...chat, unreadMessages } : chat)),
            );
        },
        [chats._id],
    );

    useEffect(() => {
        socket.on('new-message', handleNewMessage);
        return () => {
            socket.off('new-message', handleNewMessage);
        };
    }, [handleNewMessage]);

    useEffect(() => {
        socket.on('unread-messages-updated', handleUnreadMessagesUpdated);
        return () => {
            socket.off('unread-messages-updated', handleUnreadMessagesUpdated);
        };
    }, [handleUnreadMessagesUpdated]);

    const totalUnreadCount = chats.reduce((total, chat) => {
        return total + (chat.unreadMessages?.[user?._id] || 0);
    }, 0);

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
                                    {totalUnreadCount > 0 && <span>{totalUnreadCount}</span>}
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

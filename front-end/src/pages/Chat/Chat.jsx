import { useState, useEffect, useContext, useRef } from 'react';
import classNames from 'classnames/bind';
import styles from './Chat.module.scss';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import SidebarChat from '../../components/SidebarChat/SidebarChat';
import ContentChat from '../../components/ContentChat/ContentChat';
import { token } from '../../../config';
import { authContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const cx = classNames.bind(styles);
const socket = io(import.meta.env.VITE_REACT_PUBLIC_BASE_URL);

const Chat = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const { role } = useContext(authContext);
    const [userChats, setUserChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        socket.on('new-message', (newMessage) => {
            // Check if the message belongs to the current chat
            const updatedChats = userChats.map((chat) => {
                if (chat._id === newMessage.chatId) {
                    return {
                        ...chat,
                        messages: [...chat.messages, newMessage],
                        unreadMessages: {
                            ...chat.unreadMessages,
                            [user._id]: chat.unreadMessages[user._id] + 1, // Increase the number of unread messages
                        },
                    };
                }
                return chat;
            });

            setSelectedChat(updatedChats);
        });

        return () => {
            socket.off('new-message');
        };
    }, [userChats, user._id]);

    useEffect(() => {
        const fetchUserChats = async () => {
            if (isFirstLoad.current) {
                setIsLoading(true);
                isFirstLoad.current = false;
            }

            try {
                const response = await axios.get(`${BASE_URL}/chats/user-chats/${user?._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Check and remove hidden messages based on localStorage
                let chats = response.data;
                const hiddenMessages = JSON.parse(localStorage.getItem(`hiddenMessages_${user._id}`)) || [];
                chats = chats.map((chat) => {
                    chat.messages = chat.messages.filter((msg) => !hiddenMessages.includes(msg._id));
                    return chat;
                });

                setUserChats(chats);
            } catch (error) {
                console.error('Failed to fetch user chats: ', error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserChats();
    }, [selectedChat?._id, selectedChat?.messages]);

    const handleSelectChat = async (chat) => {
        const updatedChat = { ...chat };

        if (updatedChat.unreadMessages[user?._id] > 0) {
            updatedChat.unreadMessages[user?._id] = 0;

            try {
                await axios.post(`${BASE_URL}/chats/update-unread-messages`, {
                    chatId: updatedChat._id,
                    userId: user?._id,
                });
            } catch (error) {
                console.error('Failed to update unread messages:', error);
            }
        }

        setSelectedChat(updatedChat);
    };

    return (
        <div className={cx('container')}>
            <SidebarChat
                chats={userChats}
                selectedChat={selectedChat}
                handleSelectChat={handleSelectChat}
                role={role}
                userId={user?._id}
                isLoading={isLoading}
                isError={isError}
            />
            <ContentChat selectedChat={selectedChat} setSelectedChat={setSelectedChat} userId={user?._id} role={role} />
        </div>
    );
};

export default Chat;

import { useState, useEffect, useContext, useRef } from 'react';
import classNames from 'classnames/bind';
import styles from './Chat.module.scss';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import SidebarChat from '../../components/SidebarChat/SidebarChat';
import ContentChat from '../../components/ContentChat/ContentChat';
import { token } from '../../../config';
import { authContext } from '../../context/AuthContext';

// Import socket.io-client ONCE here
import { io } from 'socket.io-client';

const cx = classNames.bind(styles);

// Create a single global socket instance
const socket = io(import.meta.env.VITE_REACT_PUBLIC_SOCKET_URL);

const Chat = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const { role } = useContext(authContext);

    const [userChats, setUserChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const isFirstLoad = useRef(true);

    // Notify server user is online
    useEffect(() => {
        if (user?._id) {
            socket.emit('user-online', { userId: user._id });
            socket.userId = user._id; // For server to handle disconnect
        }
    }, [user?._id]);

    // Fetch all user chats once
    useEffect(() => {
        const fetchUserChats = async () => {
            if (isFirstLoad.current) {
                setIsLoading(true);
                isFirstLoad.current = false;
            }
            try {
                const response = await axios.get(`${BASE_URL}/chats/user-chats/${user?._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                let chats = response.data;
                // If you have local "hidden messages" logic, apply it here
                const hiddenMessages = JSON.parse(localStorage.getItem(`hiddenMessages_${user?._id}`)) || [];

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

        if (user?._id) {
            fetchUserChats();
        }
    }, [user?._id]);

    // Join all rooms so we can receive new-message for any chat
    useEffect(() => {
        if (userChats.length > 0) {
            userChats.forEach((chat) => {
                console.log('DEBUG: Client joining chat room:', chat._id);
                socket.emit('join-chat', chat._id);
            });
        }
    }, [userChats]);

    // Listen for 'new-message' globally and update userChats + selectedChat
    useEffect(() => {
        const handleNewMessage = (newMessage) => {
            console.log('DEBUG: Received new-message from server:', newMessage);
            const { chatId } = newMessage;

            // Update userChats
            setUserChats((prevChats) => {
                return prevChats.map((chat) => {
                    if (chat._id === chatId) {
                        // Check for duplicates
                        const isDuplicate = chat.messages.some((msg) => msg._id === newMessage._id);
                        if (isDuplicate) return chat;

                        return {
                            ...chat,
                            messages: [...chat.messages, newMessage],
                        };
                    }
                    return chat;
                });
            });

            // If the correct chatId is open, update selectedChat
            setSelectedChat((prevSelected) => {
                if (!prevSelected) return prevSelected;
                if (prevSelected._id !== chatId) return prevSelected;

                // Check duplicate in selectedChat
                const isDuplicate = prevSelected.messages.some((msg) => msg._id === newMessage._id);
                if (isDuplicate) return prevSelected;

                return {
                    ...prevSelected,
                    messages: [...prevSelected.messages, newMessage],
                };
            });
        };

        socket.on('new-message', handleNewMessage);

        // Cleanup
        return () => {
            socket.off('new-message', handleNewMessage);
        };
    }, []);

    // Handle user selecting a chat from the sidebar
    const handleSelectChat = async (chat) => {
        const updatedChat = { ...chat };

        // Reset unreadMessages
        if (updatedChat.unreadMessages?.[user?._id] > 0) {
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

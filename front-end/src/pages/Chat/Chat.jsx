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
    const joinedRooms = useRef(new Set());
    useEffect(() => {
        if (socket.connected && userChats.length > 0) {
            userChats.forEach((chat) => {
                if (!joinedRooms.current.has(chat._id)) {
                    socket.emit('join-chat', { chatId: chat._id, userId: user?._id, role });
                    joinedRooms.current.add(chat._id);
                }
            });
        }
    }, [userChats, user?._id, role]);

    // Listen for 'new-message' globally and update userChats + selectedChat
    useEffect(() => {
        const handleNewMessage = (newMessage) => {
            const { chatId } = newMessage;

            // Update userChats
            setUserChats((prevChats) => {
                return prevChats.map((chat) => {
                    if (chat._id === chatId) {
                        // Check for duplicates
                        const isDuplicate = chat.messages.some((msg) => msg._id === newMessage._id);
                        if (isDuplicate) return chat;

                        // If the chat is not opened (unselected), increase the number of unread messages
                        const unreadMessagesCount =
                            selectedChat && selectedChat._id === chatId
                                ? 0 // Chat is open, no "unread" messages
                                : (chat.unreadMessages[user._id] || 0) + 1; // Increase the number of "unread"

                        return {
                            ...chat,
                            messages: [...chat.messages, newMessage],
                            unreadMessages: {
                                ...chat.unreadMessages,
                                [user._id]: unreadMessagesCount, // Cập nhật số lượng "unread"
                            },
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
    }, [selectedChat, user._id]);

    // Listen for 'message-removed' and 'message-edited' events
    useEffect(() => {
        const handleMessageRemoved = ({ chatId, messageId }) => {
            // Update conversation list
            setUserChats((prevChats) =>
                prevChats.map((chat) =>
                    chat._id === chatId
                        ? {
                              ...chat,
                              messages: chat.messages.filter((msg) => msg._id !== messageId),
                          }
                        : chat,
                ),
            );

            // Update open chat
            setSelectedChat((prevChat) => {
                if (!prevChat || prevChat._id !== chatId) return prevChat;
                return {
                    ...prevChat,
                    messages: prevChat.messages.filter((msg) => msg._id !== messageId),
                };
            });
        };

        const handleMessageEdited = ({ chatId, messageId, newContent }) => {
            // Update conversation list
            setUserChats((prevChats) =>
                prevChats.map((chat) =>
                    chat._id === chatId
                        ? {
                              ...chat,
                              messages: chat.messages.map((msg) =>
                                  msg._id === messageId ? { ...msg, content: newContent } : msg,
                              ),
                          }
                        : chat,
                ),
            );

            // Update open chat
            setSelectedChat((prevChat) => {
                if (!prevChat || prevChat._id !== chatId) return prevChat;
                return {
                    ...prevChat,
                    messages: prevChat.messages.map((msg) =>
                        msg._id === messageId ? { ...msg, content: newContent } : msg,
                    ),
                };
            });
        };

        socket.on('message-removed', handleMessageRemoved);
        socket.on('message-edited', handleMessageEdited);

        // Cleanup when component unmount
        return () => {
            socket.off('message-removed', handleMessageRemoved);
            socket.off('message-edited', handleMessageEdited);
        };
    }, []);

    // Listen for user status changes
    useEffect(() => {
        const handleUserStatusChanged = ({ userId, status, role }) => {
            // Update status in userChats list
            setUserChats((prevChats) =>
                prevChats.map((chat) => {
                    if (role === 'patient' && chat.user._id === userId) {
                        return {
                            ...chat,
                            user: { ...chat.user, status },
                        };
                    } else if (role === 'doctor' && chat.doctor._id === userId) {
                        return {
                            ...chat,
                            doctor: { ...chat.doctor, status },
                        };
                    }
                    return chat;
                }),
            );

            // Update status in selectedChat if userId or doctorId match
            setSelectedChat((prevSelectedChat) => {
                if (!prevSelectedChat) return prevSelectedChat;

                if (role === 'patient' && prevSelectedChat.user._id === userId) {
                    return {
                        ...prevSelectedChat,
                        user: { ...prevSelectedChat.user, status },
                    };
                } else if (role === 'doctor' && prevSelectedChat.doctor._id === userId) {
                    return {
                        ...prevSelectedChat,
                        doctor: { ...prevSelectedChat.doctor, status },
                    };
                }
                return prevSelectedChat;
            });
        };

        // Listen for events from the server
        socket.on('user-status-changed', handleUserStatusChanged);

        // Cleanup khi component unmount
        return () => {
            socket.off('user-status-changed', handleUserStatusChanged);
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

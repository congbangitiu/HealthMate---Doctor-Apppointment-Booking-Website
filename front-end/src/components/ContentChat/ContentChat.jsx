import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ContentChat.module.scss';
import { IoCall, IoVideocam, IoSearchSharp } from 'react-icons/io5';
import { ImAttachment } from 'react-icons/im';
import { MdInsertEmoticon } from 'react-icons/md';
import { IoMdSend, IoMdMore, IoIosCloseCircle } from 'react-icons/io';
import { FaCircleCheck } from 'react-icons/fa6';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import axios from 'axios';
import { BASE_URL, token } from '../../../config';
import { PropTypes } from 'prop-types';
import uploadImageToCloudinary from '../../utils/uploadCloudinary';
import MoonLoader from 'react-spinners/MoonLoader';
import {Image} from 'antd'

const cx = classNames.bind(styles);

const ContentChat = ({ selectedChat, setSelectedChat, userId, role }) => {
    const [openPicker, setOpenPicker] = useState(false);
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);
    const [activeBubbleIndex, setActiveBubbleIndex] = useState(null);
    const [messageToEdit, setMessageToEdit] = useState(null);
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [imageOrientation, setImageOrientation] = useState({});
    const targetRef = useRef(null);

    const handleClickOutside = (event) => {
        if (targetRef.current && !targetRef.current.contains(event.target)) {
            setOpenPicker(false);
            setActiveMenuIndex(null);
            setActiveBubbleIndex(null);
        }
    };

    const handleImageLoad = (event, index) => {
        const { naturalWidth, naturalHeight } = event.target;
        const isPortrait = naturalHeight > naturalWidth;
        setImageOrientation((prevState) => ({
            ...prevState,
            [index]: isPortrait ? 'portrait' : 'landscape',
        }));
    };

    const handleMoreClick = (index) => {
        setActiveMenuIndex(activeMenuIndex === index ? null : index);
        setActiveBubbleIndex(activeBubbleIndex === index ? null : index);
    };

    useEffect(() => {
        if (openPicker || activeMenuIndex !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openPicker, activeMenuIndex]);

    const determineMessageType = () => {
        if (files.length > 0) {
            // Assuming files contain objects with URLs from Cloudinary
            const fileType = files[0].url.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType)) {
                return 'media'; // Type is media for image files
            } else if (['doc', 'docx', 'pdf'].includes(fileType)) {
                return 'document'; // Type is document for doc/pdf files
            }
        } else if (message.trim().startsWith('http')) {
            return 'link'; // Type is link if the message starts with "http"
        } else {
            return 'text'; // Default type is text
        }
    };

    const handleSendMessage = async () => {
        const typeOfMessage = determineMessageType();

        let content;

        if (typeOfMessage === 'media') {
            content = files[0].url; // Use the URL of the uploaded image
        } else {
            content = message.trim(); // Use the text message content
        }

        try {
            const response = await axios.post(
                `${BASE_URL}/chats/send-message`,
                {
                    chatId: selectedChat._id,
                    senderId: userId,
                    senderModel: role === 'doctor' ? 'Doctor' : 'User',
                    type: typeOfMessage,
                    content: content, // Use the message or the uploaded file URL
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            console.log(content);

            if (response.status === 200 && selectedChat) {
                const newMessage = {
                    ...response.data.messages[response.data.messages.length - 1],
                    sender: { _id: userId }, // Assign userId to new messages
                };
                const updatedMessages = [...selectedChat.messages, newMessage];

                setSelectedChat({ ...selectedChat, messages: updatedMessages });
                setMessage('');
                setFiles([]);
            }
        } catch (error) {
            console.error('Failed to send message: ', error);
        }
    };

    const handleRemoveMessageForYou = (messageId) => {
        let hiddenMessages = JSON.parse(localStorage.getItem(`hiddenMessages_${userId}`)) || [];
        hiddenMessages.push(messageId);
        localStorage.setItem(`hiddenMessages_${userId}`, JSON.stringify(hiddenMessages));

        const updatedMessages = selectedChat.messages.filter((msg) => msg._id !== messageId);
        setSelectedChat({ ...selectedChat, messages: updatedMessages });
        return;
    };

    const handleRemoveMessageForEveryone = async (actionType, messageId) => {
        try {
            const response = await axios.post(
                `${BASE_URL}/chats/handle-message-action`,
                {
                    chatId: selectedChat._id,
                    messageId,
                    actionType,
                    userId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status === 200) {
                setSelectedChat(response.data.chat);
            }
        } catch (error) {
            console.error('Failed to perform action on message: ', error);
        }
    };

    const handleShowEditMessage = (message) => {
        setMessageToEdit(message);
        setMessage(message.content);
    };

    const handleCancelEdit = () => {
        setMessageToEdit(null);
        setMessage('');
    };

    const handleEditMessage = async (actionType, newContent) => {
        try {
            const response = await axios.post(
                `${BASE_URL}/chats/handle-message-action`,
                {
                    chatId: selectedChat._id,
                    messageId: messageToEdit._id,
                    actionType,
                    newContent,
                    userId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status === 200) {
                setSelectedChat(response.data.chat);
            }
        } catch (error) {
            console.error('Failed to perform action on message: ', error);
        }
    };

    const handleSubmitMessage = (actionType, messageId, newContent) => {
        if (newContent === '') return;
        else if (!messageToEdit) {
            handleSendMessage();
        } else handleEditMessage(actionType, messageId, newContent);
    };

    const handleFileUpload = async (event) => {
        setIsUploadingFile(true);
        const file = event.target.files[0];
        if (file) {
            const uploadedImageUrl = await uploadImageToCloudinary(file);
            setFiles((prevFiles) => [...prevFiles, uploadedImageUrl]);
        }
        setIsUploadingFile(false);
    };

    if (!selectedChat) {
        return <div className={cx('not-selected-chat')}>Select a chat to start messaging</div>;
    }

    return (
        <div className={cx('container')}>
            <div className={cx('header-part')}>
                <div className={cx('info')}>
                    <div className={cx('img-wrapper')}>
                        <img src={role === 'doctor' ? selectedChat.user.photo : selectedChat.doctor.photo} alt="" />
                        <div></div>
                    </div>
                    <div>
                        <h4>
                            {role === 'doctor' ? selectedChat.user.fullname : 'Dr. ' + selectedChat.doctor.fullname}
                        </h4>

                        <p>Online</p>
                    </div>
                </div>
                <div className={cx('actions')}>
                    <button>
                        <IoCall className={cx('icon')} />
                    </button>
                    <button>
                        <IoVideocam className={cx('icon')} />
                    </button>
                    <button>
                        <IoSearchSharp className={cx('icon')} />
                    </button>
                </div>
            </div>

            <div className={cx('content-part')}>
                {selectedChat.messages.length <= 0 ? (
                    <div className={cx('no-message')}>No message yet</div>
                ) : (
                    selectedChat.messages.map((msg, index) => (
                        <div
                            key={index}
                            className={cx('messages', msg.sender?._id === userId ? 'outgoing' : 'incoming')}
                        >
                            <div
                                className={cx('bubble', msg.type, {
                                    active: activeBubbleIndex === index,
                                    [imageOrientation[index]]: msg.type === 'media',
                                })}
                                ref={targetRef}
                            >
                                {msg.type === 'text' && <p>{msg.content}</p>}
                                {msg.type === 'media' && (                                  
                                    <Image 
                                        src={msg.content} 
                                        onLoad={(event) => handleImageLoad(event, index)} 
                                        preview={true}
                                    />
                                )}
                            </div>

                            <div className={cx('modes')}>
                                <IoMdMore className={cx('icon')} onClick={() => handleMoreClick(index)} />
                                {activeMenuIndex === index && (
                                    <div
                                        ref={targetRef}
                                        className={cx('menu', msg.sender?._id === userId ? 'outgoing' : 'incoming', {
                                            active: activeMenuIndex === index,
                                        })}
                                    >
                                        {msg.sender?._id === userId && (
                                            <>
                                                {msg.type !== 'media' && (
                                                    <div onClick={() => handleShowEditMessage(msg)}>Edit</div>
                                                )}
                                                <div
                                                    onClick={() =>
                                                        handleRemoveMessageForEveryone('removeForEveryone', msg._id)
                                                    }
                                                >
                                                    Remove for everyone
                                                </div>
                                            </>
                                        )}
                                        <div onClick={() => handleRemoveMessageForYou(msg._id)}>Remove for you</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={cx('footer-part')}>
                <div className={cx('edit-file-type')}>
                    {messageToEdit && (
                        <div className={cx('edit-part')}>
                            <div>
                                <h4>Edit message</h4>
                                <p>{messageToEdit.content}</p>
                            </div>
                            <IoIosCloseCircle className={cx('icon')} onClick={handleCancelEdit} />
                        </div>
                    )}
                    {files.length > 0 && (
                        <div className={cx('file-part')}>
                            {files.map((file, index) => (
                                <div key={index} className={cx('img-wrapper')}>
                                    <img src={file.url} alt="" />
                                    <IoIosCloseCircle
                                        className={cx('icon')}
                                        onClick={() => setFiles(files.filter((_, fileIndex) => fileIndex !== index))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={cx('type-part')}>
                        <div>
                            <label htmlFor="inputFile">
                                {isUploadingFile ? (
                                    <MoonLoader size={20} color="#000000" />
                                ) : (
                                    <ImAttachment className={cx('icon')} />
                                )}
                            </label>
                            <input id="inputFile" type="file" hidden onChange={handleFileUpload} />
                        </div>
                        <input
                            type="text"
                            placeholder="Write a message ..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmitMessage('edit', message);
                                }
                            }}
                        />
                        <div ref={targetRef} onClick={() => setOpenPicker(!openPicker)}>
                            <MdInsertEmoticon className={cx('icon')} />
                        </div>
                    </div>
                </div>
                <div
                    className={cx('send-part', { disabled: message === '' && !message && files.length <= 0 })}
                    onClick={() => handleSubmitMessage('edit', message)}
                >
                    {messageToEdit ? <FaCircleCheck className={cx('icon')} /> : <IoMdSend className={cx('icon')} />}
                </div>

                {openPicker && (
                    <div ref={targetRef} className={cx('picker')}>
                        <Picker data={data} onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji.native)} />
                    </div>
                )}
            </div>
        </div>
    );
};

ContentChat.propTypes = {
    selectedChat: PropTypes.object,
    userId: PropTypes.string,
    setSelectedChat: PropTypes.func,
    role: PropTypes.string,
};

export default ContentChat;

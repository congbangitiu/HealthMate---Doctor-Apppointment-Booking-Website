import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './ContentChat.module.scss';
import { IoCall, IoVideocam, IoSearchSharp, IoDocumentText } from 'react-icons/io5';
import { ImAttachment } from 'react-icons/im';
import { MdInsertEmoticon } from 'react-icons/md';
import { IoMdSend, IoMdMore, IoIosCloseCircle } from 'react-icons/io';
import { HiDownload } from 'react-icons/hi';
import { FaCircleCheck } from 'react-icons/fa6';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import axios from 'axios';
import { BASE_URL, token } from '../../../config';
import { PropTypes } from 'prop-types';
import {
    uploadImageToCloudinary,
    uploadVideoToCloudinary,
    uploadDocumentToCloudinary,
} from '../../utils/uploadCloudinary';
import MoonLoader from 'react-spinners/MoonLoader';
import { Image } from 'antd';
import formatTimestamp from '../../utils/formatTimestamp';
import convertFileSize from '../../utils/convertFileSize';
import truncateText from '../../utils/truncateText';

import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_REACT_PUBLIC_SOCKET_URL);

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
    const [videoOrientation, setVideoOrientation] = useState({});
    const targetRef = useRef(null);
    const contentPartRef = useRef(null);

    // Scroll down when chat changes
    useLayoutEffect(() => {
        if (contentPartRef.current) {
            // Delay the scroll action to ensure content is fully rendered
            setTimeout(() => {
                contentPartRef.current.scrollTo({
                    top: contentPartRef.current.scrollHeight,
                });
            }, 200); // Delay of 200ms to ensure the chat content is rendered
        }
    }, [selectedChat?._id]);

    // Smooth scroll when new messages appear
    useEffect(() => {
        if (contentPartRef.current) {
            contentPartRef.current.scrollTo({
                top: contentPartRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [selectedChat?.messages]);

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

    const handleVideoLoad = (event, index) => {
        const videoElement = event.target;

        const isPortrait = videoElement.videoHeight > videoElement.videoWidth;

        setVideoOrientation((prev) => ({
            ...prev,
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
        const messageTypes = [];

        // Handle files
        if (files.length > 0) {
            const fileMessages = files
                .map((file) => {
                    if (file.fileType === 'image') {
                        return { type: 'media', mediaType: 'image', fileDetails: file };
                    } else if (file.fileType === 'video') {
                        return { type: 'media', mediaType: 'video', fileDetails: file };
                    } else if (['doc', 'docx', 'xlsx', 'csv', 'pdf'].includes(file.fileType)) {
                        return { type: 'document', fileDetails: file };
                    }
                    return null;
                })
                .filter((item) => item !== null); // Remove any null values
            messageTypes.push(...fileMessages);
        }

        // Handle links within the text
        const containsUrl = (text) => {
            const urlPattern = /(https?:\/\/[^\s]+)/g; // Basic URL pattern
            return urlPattern.test(text);
        };

        // Handle message text (link or regular text)
        if (message.trim()) {
            if (containsUrl(message)) {
                messageTypes.push({ type: 'link', content: message.trim() }); // Recognize the message as a link
            } else {
                messageTypes.push({ type: 'text', content: message.trim() }); // Regular text message
            }
        }

        // Return the final message types (could contain both files and text)
        return messageTypes;
    };

    const handleSendMessage = async () => {
        const messageTypes = determineMessageType();
        if (messageTypes.length === 0) return;

        try {
            for (const messageType of messageTypes) {
                let messagePayload = {
                    chatId: selectedChat._id,
                    senderId: userId,
                    senderModel: role === 'doctor' ? 'Doctor' : 'User',
                    type: messageType.type,
                };

                // files
                if (messageType.type === 'media' || messageType.type === 'document') {
                    const content = messageType.fileDetails.fileUrl;
                    messagePayload = {
                        ...messagePayload,
                        content,
                        ...(messageType.type === 'media' && { mediaType: messageType.mediaType }),
                        ...(messageType.type === 'document' && {
                            documentDetails: {
                                documentName: messageType.fileDetails.fileName,
                                documentSize: messageType.fileDetails.fileSize,
                                documentType: messageType.fileDetails.fileType,
                            },
                        }),
                    };
                }
                // text/link
                else {
                    messagePayload = {
                        ...messagePayload,
                        content: messageType.content,
                    };
                }

                // Emit the message via WebSocket
                socket.emit('send-message', messagePayload);
            }

            // Clear state
            setMessage('');
            setFiles([]);
        } catch (error) {
            console.error('Failed to send message: ', error);
        }
    };

    const handleRemoveMessageForYou = (messageId) => {
        // Retrieve the list of hiddenMessages from localStorage
        let hiddenMessages = JSON.parse(localStorage.getItem(`hiddenMessages_${userId}`)) || [];

        // Check if the message has been deleted for everyone (no longer exists in selectedChat.messages)
        const updatedMessages = selectedChat.messages.filter((msg) => msg._id !== messageId);

        // Remove messages that have been deleted from the hiddenMessages list
        const updatedHiddenMessages = hiddenMessages.filter((hiddenMessageId) =>
            updatedMessages.some((msg) => msg._id === hiddenMessageId),
        );

        // Add the messageId to hiddenMessages if the message hasn't been deleted completely
        if (!updatedHiddenMessages.includes(messageId)) {
            updatedHiddenMessages.push(messageId);
        }

        // Update hiddenMessages in localStorage
        localStorage.setItem(`hiddenMessages_${userId}`, JSON.stringify(updatedHiddenMessages));

        // Update selectedChat with the updated messages
        setSelectedChat({ ...selectedChat, messages: updatedMessages });
        setActiveMenuIndex(null);
        setActiveBubbleIndex(null);
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
                // Update selectedChat with the response data (chat)
                setSelectedChat(response.data.chat);

                // After removing the message for everyone, update hiddenMessages accordingly
                handleRemoveMessageForYou(messageId);
            }

            // Reset the active menu and bubble index after performing the action
            setActiveMenuIndex(null);
            setActiveBubbleIndex(null);
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

            handleCancelEdit();
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
        const uploadedFiles = [];

        const filesToUpload = Array.from(event.target.files); // Convert FileList to Array

        for (const file of filesToUpload) {
            let uploadedFileUrl;

            // Determine if the file is an image or video
            const mediaType = file.type.split('/')[0];
            // Determine if the file is a document
            const documentType = file.name.split('.').pop().toLowerCase();

            if (mediaType === 'image') {
                uploadedFileUrl = await uploadImageToCloudinary(file);
            } else {
                uploadedFileUrl = await uploadVideoToCloudinary(file);
            }

            if (['doc', 'docx', 'xlsx', 'csv', 'pdf'].includes(documentType)) {
                uploadedFileUrl = await uploadDocumentToCloudinary(file);
            }

            const determineFileType = () => {
                if (mediaType === 'image') return 'image';
                else if (mediaType === 'video') return 'video';
                else return documentType;
            };

            if (uploadedFileUrl) {
                uploadedFiles.push({
                    fileUrl: uploadedFileUrl.secure_url,
                    fileName: uploadedFileUrl.original_filename,
                    fileSize: uploadedFileUrl.bytes,
                    fileType: determineFileType(),
                });
            }
        }

        setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
        setIsUploadingFile(false);
    };

    const handleTimeCheck = (currentTimestamp, previousTimestamp, difference) => {
        return new Date(currentTimestamp) - new Date(previousTimestamp) >= difference * 60 * 1000;
    };

    const handleDownloadFile = (fileUrl, fileName) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

            <div className={cx('content-part')} ref={contentPartRef}>
                {selectedChat.messages.length <= 0 ? (
                    <div className={cx('no-message')}>No message yet</div>
                ) : (
                    selectedChat.messages.map((msg, index) => (
                        <div key={index}>
                            {index === 0 ||
                            handleTimeCheck(msg.timestamp, selectedChat.messages[index - 1].timestamp, 10) ? (
                                <p className={cx('timestamp')}>{formatTimestamp(msg.timestamp, 'datetime')}</p>
                            ) : null}
                            <div className={cx('messages', msg.sender?._id === userId ? 'outgoing' : 'incoming')}>
                                <div
                                    className={cx('bubble', msg.type, msg.mediaType, {
                                        active: activeBubbleIndex === index,
                                    })}
                                    ref={targetRef}
                                >
                                    {msg.type === 'text' && <p>{msg.content}</p>}
                                    {msg.type === 'media' && msg.mediaType === 'image' && (
                                        <Image
                                            src={msg.content}
                                            onLoad={(event) => handleImageLoad(event, index)}
                                            preview={{ mask: false }}
                                            className={cx({
                                                'image-portrait': imageOrientation[index] === 'portrait',
                                                'image-landscape': imageOrientation[index] === 'landscape',
                                            })}
                                        />
                                    )}
                                    {msg.type === 'media' && msg.mediaType === 'video' && (
                                        <video
                                            controls
                                            src={msg.content}
                                            className={cx({
                                                'video-portrait': videoOrientation[index] === 'portrait',
                                                'video-landscape': videoOrientation[index] === 'landscape',
                                            })}
                                            onLoadedMetadata={(event) => handleVideoLoad(event, index)}
                                        ></video>
                                    )}
                                    {msg.type === 'document' && (
                                        <div className={cx('document')}>
                                            <div>
                                                <IoDocumentText className={cx('icon')} />
                                            </div>
                                            <div>
                                                <h4>
                                                    {truncateText(msg.documentDetails.documentName, 30)}.
                                                    {msg.documentDetails.documentType}
                                                </h4>
                                                <p>{convertFileSize(msg.documentDetails.documentSize)}</p>
                                            </div>
                                            <div
                                                onClick={() =>
                                                    handleDownloadFile(
                                                        msg.content,
                                                        `${msg.documentDetails.documentName}.${msg.documentDetails.documentType}`,
                                                    )
                                                }
                                            >
                                                <HiDownload className={cx('icon')} />
                                            </div>
                                        </div>
                                    )}
                                    {msg.type === 'link' && (
                                        <a
                                            href={msg.content}
                                            className={cx('link')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {msg.content}
                                        </a>
                                    )}
                                </div>

                                <div className={cx('modes')}>
                                    <IoMdMore className={cx('icon')} onClick={() => handleMoreClick(index)} />
                                    {activeMenuIndex === index && (
                                        <div
                                            ref={targetRef}
                                            className={cx(
                                                'menu',
                                                msg.sender?._id === userId ? 'outgoing' : 'incoming',
                                                {
                                                    active: activeMenuIndex === index,
                                                },
                                            )}
                                        >
                                            {msg.sender?._id === userId && (
                                                <>
                                                    {msg.type === 'text' && (
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
                                <div key={index} className={cx('file-wrapper')}>
                                    {file.fileType === 'image' && <img src={file.fileUrl} alt="" />}
                                    {file.fileType === 'video' && (
                                        <video controls>
                                            <source src={file.fileUrl} type="video/mp4" />
                                        </video>
                                    )}
                                    {['doc', 'docx', 'xlsx', 'csv', 'pdf'].includes(file.fileType) && (
                                        <div className={cx('document')}>
                                            <IoDocumentText className={cx('document-icon')} />
                                            <h4>{file.fileType}</h4>
                                        </div>
                                    )}
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
                            <input
                                id="inputFile"
                                type="file"
                                multiple
                                hidden
                                onChange={handleFileUpload}
                                accept=".png, .jpg, .jpeg, .gif, .mp4, .mov, .doc, .docx, .xlsx, .csv, .pdf"
                            />
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

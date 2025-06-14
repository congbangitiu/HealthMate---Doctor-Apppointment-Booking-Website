import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './SidebarChat.module.scss';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import PropTypes from 'prop-types';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/Error/Error';
import truncateFullname from './../../utils/text/truncateFullname';
import formatTimestamp from './../../utils/date-time/formatTimestamp';
import truncateText from '../../utils/text/truncateText';

const cx = classNames.bind(styles);

const SidebarChat = ({ chats, selectedChat, handleSelectChat, role, userId, isLoading, isError }) => {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        setQuery(query.trim());
    };

    const handleInputChange = (e) => {
        const updatedQuery = e.target.value.replace(/^\s+/, '');
        setQuery(updatedQuery);
    };

    const handleClearSearch = () => {
        setQuery('');
    };

    const filteredChats = chats.filter(
        (chat) =>
            chat.doctor.fullname.toLowerCase().includes(query.toLowerCase()) ||
            chat.user.fullname.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className={cx('container')}>
            <h1>Chats</h1>
            <div className={cx('search-wrapper')}>
                <input
                    type="text"
                    name="search"
                    id="searchInput"
                    placeholder="Type name ..."
                    value={query}
                    onChange={handleInputChange}
                />
                {query ? (
                    <div className={cx('close-icon-wrapper')}>
                        <IoMdCloseCircle className={cx('close-icon')} onClick={handleClearSearch} />
                    </div>
                ) : (
                    <div className={cx('search-icon-wrapper')} onClick={handleSearch}>
                        <FaSearch className={cx('search-icon')} />
                    </div>
                )}
            </div>

            {isLoading ? (
                <Loader iconSize={12} />
            ) : isError ? (
                <Error errorMessage="Fetch data failed" />
            ) : (
                <div className={cx('chats')}>
                    {filteredChats.length > 0 &&
                        filteredChats.map((chat) => (
                            <div
                                key={chat._id}
                                className={cx('chat', { currentChat: selectedChat?._id === chat._id })}
                                onClick={() => handleSelectChat(chat)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={cx('img-wrapper')}>
                                    <img src={role === 'doctor' ? chat.user.photo : chat.doctor.photo} alt="" />
                                    {role === 'doctor'
                                        ? chat.user.status === 'online' && <div></div>
                                        : chat.doctor.status === 'online' && <div></div>}
                                </div>
                                <div className={cx('intro')}>
                                    <div>
                                        <h4>
                                            {role === 'doctor'
                                                ? truncateFullname(chat.user.fullname)
                                                : 'Dr. ' + truncateFullname(chat.doctor.fullname)}
                                        </h4>

                                        {chat.messages && chat.messages.length > 0 && (
                                            <p>
                                                {formatTimestamp(
                                                    chat.messages[chat.messages.length - 1].timestamp,
                                                    'date',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        {chat.messages && chat.messages.length > 0 ? (
                                            <>
                                                <p
                                                    className={cx({
                                                        'unread-message': chat.unreadMessages[userId] > 0,
                                                    })}
                                                >
                                                    {chat.messages[chat.messages.length - 1].sender._id === userId ? (
                                                        <>
                                                            {chat.messages[chat.messages.length - 1].type ===
                                                                'text' && (
                                                                <>
                                                                    You:{' '}
                                                                    {truncateText(
                                                                        chat.messages[chat.messages.length - 1].content,
                                                                        18,
                                                                    )}
                                                                </>
                                                            )}
                                                            {chat.messages[chat.messages.length - 1].mediaType ===
                                                                'image' && <>You sent an image</>}
                                                            {chat.messages[chat.messages.length - 1].mediaType ===
                                                                'video' && <>You sent a video</>}
                                                            {chat.messages[chat.messages.length - 1].type ===
                                                                'document' && <>You sent an attachment</>}
                                                            {chat.messages[chat.messages.length - 1].type ===
                                                                'link' && <>You sent a link</>}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {chat.messages[chat.messages.length - 1].type ===
                                                                'text' && (
                                                                <>
                                                                    {truncateText(
                                                                        chat.messages[chat.messages.length - 1].content,
                                                                        22,
                                                                    )}
                                                                </>
                                                            )}
                                                            {chat.messages[chat.messages.length - 1].mediaType ===
                                                                'image' && (
                                                                <>
                                                                    {role === 'doctor'
                                                                        ? truncateFullname(chat.user.fullname)
                                                                        : truncateFullname(chat.doctor.fullname)}{' '}
                                                                    sent an image
                                                                </>
                                                            )}
                                                            {chat.messages[chat.messages.length - 1].mediaType ===
                                                                'video' && (
                                                                <>
                                                                    {role === 'doctor'
                                                                        ? truncateFullname(chat.user.fullname)
                                                                        : truncateFullname(chat.doctor.fullname)}{' '}
                                                                    sent a video
                                                                </>
                                                            )}
                                                            {chat.messages[chat.messages.length - 1].type ===
                                                                'document' && (
                                                                <>
                                                                    {role === 'doctor'
                                                                        ? truncateFullname(chat.user.fullname)
                                                                        : truncateFullname(chat.doctor.fullname)}{' '}
                                                                    sent an attachment
                                                                </>
                                                            )}
                                                            {chat.messages[chat.messages.length - 1].type ===
                                                                'link' && (
                                                                <>
                                                                    {role === 'doctor'
                                                                        ? truncateFullname(chat.user.fullname)
                                                                        : truncateFullname(chat.doctor.fullname)}{' '}
                                                                    sent a link
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </p>

                                                {chat.unreadMessages[userId] > 0 && (
                                                    <div className={cx('unread-count')}>
                                                        {chat.unreadMessages[userId]}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p>No message yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

SidebarChat.propTypes = {
    chats: PropTypes.array.isRequired,
    selectedChat: PropTypes.object,
    handleSelectChat: PropTypes.func.isRequired,
    role: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isError: PropTypes.bool.isRequired,
};

export default SidebarChat;

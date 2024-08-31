import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './SidebarChat.module.scss';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import PropTypes from 'prop-types';
import Loader from '../../components/Loader/Loader';
import Error from '../../components/Error/Error';
import truncateFullname from './../../utils/truncateFullname';
import formatTimestamp from './../../utils/formatTimestamp';
import truncateText from './../../utils/truncateText';

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
                <Loader iconSize="12px" />
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
                                    <div></div>
                                </div>
                                <div className={cx('intro')}>
                                    <div>
                                        <h4>
                                            {role === 'doctor'
                                                ? truncateFullname(chat.user.fullname)
                                                : 'Dr. ' + truncateFullname(chat.doctor.fullname)}
                                        </h4>

                                        {chat.messages && chat.messages.length > 0 && (
                                            <p>{formatTimestamp(chat.messages[chat.messages.length - 1].timestamp)}</p>
                                        )}
                                    </div>
                                    <div>
                                        {chat.messages && chat.messages.length > 0 ? (
                                            <>
                                                <p>
                                                    {chat.messages[chat.messages.length - 1].sender._id === userId &&
                                                        'You: '}
                                                    {truncateText(chat.messages[chat.messages.length - 1].content, 22)}
                                                </p>
                                                <div>{/* Message count hoặc unread messages */}</div>
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

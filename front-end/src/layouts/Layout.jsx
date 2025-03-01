import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Layout.module.scss';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Routers from '../routes/Routers';
import ChatbotAI from '../components/ChatbotAI/ChatbotAI';
import { FaPlus } from 'react-icons/fa6';
import { IoMdChatbubbles } from 'react-icons/io';
import { GiArtificialHive } from 'react-icons/gi';

const cx = classNames.bind(styles);

const Layout = () => {
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
                {/* Only show the more-info section if the user is logged in */}
                {user && (
                    <div className={cx('fab-container', { hovered: isHovered })} onMouseLeave={handleMouseLeave}>
                        <div className={cx('fab-button', { rotate: isHovered })} onMouseEnter={handleMouseEnter}>
                            <FaPlus className={cx('icon')} />
                        </div>

                        <div className={cx('fab-options')}>
                            <Link to="/chats" className={cx('icon-wrapper')}>
                                <IoMdChatbubbles className={cx('icon-1')} />
                            </Link>
                            <div className={cx('icon-wrapper')} onClick={() => setIsShowChatbot(!isShowChatbot)}>
                                <GiArtificialHive className={cx('icon-2')} />
                            </div>
                        </div>
                    </div>
                )}
                {user && (
                    <div className={cx('chatbot-wrapper', { show: isShowChatbot })}>
                        <ChatbotAI setIsShowChatbot={setIsShowChatbot} />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Layout;

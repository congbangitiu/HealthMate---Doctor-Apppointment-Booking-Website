import { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Layout.module.scss';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Routers from '../routes/Routers';
import { FaPlus } from 'react-icons/fa6';
import { IoMdChatbubbles } from 'react-icons/io';
import { GiArtificialHive } from 'react-icons/gi';

const cx = classNames.bind(styles);

const Layout = () => {
    const [isHovered, setIsHovered] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div className={cx('container')}>
            <Header />
            <main>
                <Routers />

                {user && (
                    <div className={cx('more-info', { hovered: isHovered })} onMouseLeave={handleMouseLeave}>
                        <div className={cx('inner')}>
                            <div className={cx('icon-wrapper', { rotate: isHovered })} onMouseEnter={handleMouseEnter}>
                                <FaPlus className={cx('icon')} />
                            </div>
                            <div className={cx('icon-wrapper', { move: isHovered })}>
                                <GiArtificialHive className={cx('icon')} />
                            </div>
                            <Link to="/chats" className={cx('icon-wrapper', { move: isHovered })}>
                                <IoMdChatbubbles className={cx('icon')} />
                            </Link>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;

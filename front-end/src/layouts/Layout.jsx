import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Layout.module.scss';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import Routers from '../routes/Routers';
import { FaPlus } from 'react-icons/fa6';
import { IoMdChatbubbles } from 'react-icons/io';
import { GiArtificialHive } from 'react-icons/gi';
import io from 'socket.io-client'; // Import socket.io-client

const cx = classNames.bind(styles);
const SOCKET_URL = import.meta.env.VITE_REACT_PUBLIC_SOCKET_URL;

const Layout = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [socket, setSocket] = useState(null); // State to manage the socket connection
    const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []); // Memoize user

    // Establish a socket connection when the component mounts
    useEffect(() => {
        if (!user) return; // Ensure user exists before connecting

        // Connect to the server with the server URL from environment variables
        const newSocket = io(SOCKET_URL, {
            query: { userId: user._id }, // Send the userId when connecting
            transports: ['websocket'], // Ensure websocket is used for communication
        });

        // Store the socket connection in state
        setSocket(newSocket);

        // Listen for events from the server
        newSocket.on('connect', () => {
            console.log('Connected to server via socket', newSocket.id); // Log when connected
        });

        newSocket.on('new-message', (message) => {
            // Handle receiving a new message
            console.log('New message received: ', message);
        });

        // Handle socket disconnection
        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Clean up the socket connection when the component unmounts
        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [user]);

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
            {/* Main content */}
            <main>
                <Routers />

                {/* Only show the more-info section if the user is logged in */}
                {user && (
                    <div className={cx('more-info', { hovered: isHovered })} onMouseLeave={handleMouseLeave}>
                        <div className={cx('inner')}>
                            {/* Plus icon to toggle the more-info section */}
                            <div className={cx('icon-wrapper', { rotate: isHovered })} onMouseEnter={handleMouseEnter}>
                                <FaPlus className={cx('icon')} />
                            </div>

                            {/* Display additional options (e.g., chat or AI feature) */}
                            <div className={cx('icon-wrapper', { move: isHovered })}>
                                <GiArtificialHive className={cx('icon')} />
                            </div>

                            {/* Link to the chat page */}
                            <Link to="/chats" className={cx('icon-wrapper', { move: isHovered })}>
                                <IoMdChatbubbles className={cx('icon')} />
                            </Link>
                        </div>
                    </div>
                )}
            </main>
            <Footer /> {/* Footer component */}
        </div>
    );
};

export default Layout;

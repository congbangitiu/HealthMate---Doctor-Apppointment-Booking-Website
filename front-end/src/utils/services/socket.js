import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_REACT_PUBLIC_SOCKET_URL);
export default socket;

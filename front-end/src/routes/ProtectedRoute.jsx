import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { authContext } from './../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { token, role } = useContext(authContext);
    const isAllowed = allowedRoles.includes(role);
    const accessibleRoute = token && isAllowed ? children : <Navigate to="/login" replace={true} />;
    return accessibleRoute;
};

export default ProtectedRoute;

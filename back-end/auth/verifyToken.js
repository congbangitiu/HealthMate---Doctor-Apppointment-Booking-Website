import jwt from 'jsonwebtoken';
import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';

export const authenticate = async (req, res, next) => {
    // Get token from headers
    const authToken = req.headers.authorization;

    // Check if token exists
    if (!authToken || !authToken.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token, authorization is denied' });
    }

    try {
        const token = authToken.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token is expired' });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }
};

export const restrict = (roles) => async (req, res, next) => {
    const userId = req.userId;
    let user;
    const patient = await User.findById(userId);
    const doctor = await Doctor.findById(userId);

    if (patient) {
        user = patient;
    }
    if (doctor) {
        user = doctor;
    }

    if (!roles.includes(user.role)) {
        return res.status(401).json({
            success: false,
            message: 'You are not authorized',
        });
    }
    next();
};

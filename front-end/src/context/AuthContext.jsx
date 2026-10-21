import { createContext, useEffect, useReducer } from 'react';
import { PropTypes } from 'prop-types';

const readStoredValue = (key) => {
    const value = localStorage.getItem(key);
    return !value || value === 'null' || value === 'undefined' ? null : value;
};

const readInitialState = () => {
    try {
        return {
            user: JSON.parse(localStorage.getItem('user')),
            role: readStoredValue('role'),
            token: readStoredValue('token'),
        };
    } catch {
        return { user: null, role: null, token: null };
    }
};

const initialState = readInitialState();

export const authContext = createContext(initialState);

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                user: null,
                role: null,
                token: null,
            };

        case 'LOGIN_SUCCESS':
            return {
                user: action.payload.user,
                role: action.payload.role,
                token: action.payload.token,
            };

        case 'LOGOUT':
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            localStorage.removeItem('token');
            return {
                user: null,
                role: null,
                token: null,
            };

        default:
            return state;
    }
};

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        for (const [key, value] of Object.entries(state)) {
            if (value === null || value === undefined) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, key === 'user' ? JSON.stringify(value) : value);
            }
        }
    }, [state]);

    return (
        <authContext.Provider value={{ user: state.user, role: state.role, token: state.token, dispatch }}>
            {children}
        </authContext.Provider>
    );
};

AuthContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

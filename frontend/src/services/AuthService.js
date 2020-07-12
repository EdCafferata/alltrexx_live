import http from '../http-common';

// Login HTTP request handler + save JWT token to client localstorage (browser)
const login = async (username, password) => {
    return http.post('/auth/login', {
        username,
        password,

    })
    .then(response => {
        if (response.data.accessToken) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }

        return response.data;
    });
}

// Remove JWT token from client localstorage (browser)
const logout = () => {
    localStorage.removeItem('user');
}

// Register HTTP request handler
const register = (username, email, password) => {
    return http.post('/auth/register/', {
        username,
        email,
        password
    });
}

// Validate user with provided JWT token from user's localstorage (browser)
const getCurrentUser= () => {
    return JSON.parse(localStorage.getItem('user'));
}

// Make methods available to import in other components
export default {
    login,
    logout,
    register,
    getCurrentUser

}

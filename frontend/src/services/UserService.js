import http from '../http-common';

// Get all users API HTTP request handler
const getAll = async () => {
    return http.get('/users');
}

// Get single user by ID API HTTP request handler
const get = (userId) => {
    return http.get(`/users/${userId}`);
}

// Update user API HTTP request handler
const update = (user) => {
    return http.put('/users', user);
}

// Delete user API HTTP request handler
const remove = (userId) => {
    return http.delete(`/users/${userId}`);
}

// Make methods available to import in other components
export default {
    getAll,
    get,
    update,
    remove
}

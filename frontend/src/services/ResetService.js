import http from '../http-common';

const forgotpassword = (userId) => {
    return http.post('./uploadFile/', userId);
}

// Update user API HTTP request handler
const resetpassword = (email) => {
    return http.post('./forgot-password', email);
}


// Make methods available to import in other components
export default {
    forgotpassword,
    resetpassword
}

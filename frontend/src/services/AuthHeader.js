
export default function AuthHeader() {
    // AuthHeader gives authorization based on the AccessToken.
    const user = JSON.parse(localStorage.getItem('user'));
    // JSON.parse Converts a JavaScript Object Notation (JSON) string into an object.
    // JSON is JavaScript Objected Notation

    if (user && user.accessToken) {
        return { Authorization: 'Bearer ' + user.accessToken };
    } else {
        return {};
    }
}

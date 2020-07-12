import React from "react";
import { Card, Button, Form, Col } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faUndo, faList } from '@fortawesome/free-solid-svg-icons';
import UserToast from './UserToast';
import UserService from "../../services/UserService";

// React User Component
class User extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.initialState;
        this.state.show = false;
        this.userChange = this.userChange.bind(this);
    }

    // Initial state values
    initialState = {
        id:'',
        username:'',
        email:'',
        password:''
    }

    // Set user id upon render
    componentDidMount() {
        const userId = +this.props.match.params.id;
        if(userId) {
            this.getUserById(userId);
        }
    }

    // Get the user id via the API call and set user values
    getUserById = (userId) => {
        UserService.get(userId).then(response => {
            if(response.data != null) {
                this.setState({
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email,
                    password: response.data.password
                });
            }
            }).catch((error) => { // Else catch error
            console.error("Error - "+error)
        })
    }

    // Reset user state values
    resetUser = () => {
        this.setState(() => this.initialState);
    }

    // Update user values on change event
    updateUser = event => {
        event.preventDefault();

        const user = {
            id: this.state.id,
            username: this.state.username,
            email: this.state.email,
            password: this.state.password
        }

        // Call update API to persist updates to the database via Spring Boot
        UserService.update(user).then(response => {
            if(response.data != null) {
                this.setState({ "show":true, "method":"put" }); // Show Bootstrap toast message
                setTimeout(() => this.setState({ "show":false }), 3000); // Close Bootstrap toast message after 3 seconds
                setTimeout(() => this.userList(), 3000); // Show userlist after 3 seconds
            } else {
                this.setState({ "show":false }); // Else do not show toast
            }
        });
        this.setState(this.initialState); // Show initial state values
    }

    // Update state based on whats filled in the form fields
    userChange = event => {
        this.setState({
            [event.target.name]:event.target.value
        });
    }

    // UserList function which loads userlist page
    userList = () => {
        return this.props.history.push("/userlist");
    }

    render() {
        const {username, email, password} = this.state; // Fill this.state values

        return (
            <div>
                <div style={{"display": this.state.show ? "inline" : "none"}}> {/* When this.state.show is called, show Bootstrap toast */}
                    <UserToast show = {this.state.show} message = {this.state.method === "put" ? "User Updated Successfully." : "User Saved Successfully."} type = {"success"} />
                </div>
                <Card>
                    <Card.Header><FontAwesomeIcon icon={faEdit} /> Update User Details </Card.Header>
                    <Form onReset={this.resetUser} onSubmit={this.updateUser} id="userFormId">
                        <Card.Body>
                            <Form.Row>
                                <Form.Group as={Col} controlId="formGridName">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control required
                                                  autoComplete = "off"
                                                  type="text"
                                                  value={username}
                                                  onChange={this.userChange}
                                                  name="username"
                                                  placeholder="Enter username" />
                                </Form.Group>
                            </Form.Row>
                            <Form.Row>
                                <Form.Group as={Col} controlId="formGridStreet">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control required
                                                  autoComplete = "off"
                                                  type="text"
                                                  value={email}
                                                  onChange={this.userChange}
                                                  name="email"
                                                  placeholder="Enter email address" />
                                </Form.Group>
                            </Form.Row>
                            <Form.Row>
                                <Form.Group as={Col} controlId="formGridPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control required
                                                  autoComplete = "off"
                                                  type="password"
                                                  value={password}
                                                  onChange={this.userChange}
                                                  name="password"
                                                  placeholder="Enter password" />
                                </Form.Group>
                            </Form.Row>
                        </Card.Body>
                        <Card.Footer>
                            <Button variant="success" type="submit">
                                <FontAwesomeIcon icon={faSave} /> Update
                            </Button>{' '}
                            <Button variant="info" type="reset">
                                <FontAwesomeIcon icon={faUndo} /> Reset
                            </Button>{' '}
                            <Button variant="info" type="button" onClick={this.userList.bind()}>
                                <FontAwesomeIcon icon={faList} /> User List
                            </Button>
                        </Card.Footer>
                    </Form>
                </Card>
            </div>
        );
    }
}

export default User;

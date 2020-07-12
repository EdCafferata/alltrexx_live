import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, ButtonGroup, Button, Table } from 'react-bootstrap';

// Import Material UI components for styling
import MuiAlert from '@material-ui/lab/Alert';
import {Badge, Snackbar, makeStyles} from '@material-ui/core';
import {PeopleAlt, Person, Edit, Delete} from '@material-ui/icons';

// Import CSS for manual styling
import './UserList.css';

// Import User Service for HTTP calls to the API
import UserService from '../../services/UserService';

// Import AddUser component to add user(s) in the userlist
import AddUser from './AddUser';

// Setting standard styling for Material UI Alerts
function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" severity="warning" {...props} />;
}

// Material UI Styling settings
const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
        "& > * + *": {
            marginTop: theme.spacing(2)
        }
    }
}));

// React UserList component
const UserList = () => {
    // React Hooks State Management
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [open, setOpen] = useState(false);
    const classes = useStyles();

    // Material UI Snackbar close function
    const handleClose = () => {
        setOpen(false);
    };

    // Load all users in the userlist
    const getAllUsers = async () => {
        setError(false);
        try { // Try to get all users via API call
            const response = await UserService.getAll();
            setUsers(response.data)
        } catch (error) { // else catch the error
            setOpen(true);
            setError(error);
        }
    }

    // Delete user by User ID
    const deleteUser = (userId) => {
        UserService.remove(userId)
        .then(response => {
            if(response.data != null) { // When user is deleted there is no response, as such success
                setSuccess(true) // Activate success Material UI Snackbar
                setOpen(true) // Open Material UI Snackbar
                setUsers( // Reload userlist
                    users.filter(user => user.id !== userId)
                );
            } else {
                setOpen(true); // Open Material UI Snackbar
                setError("An error occurred"); // Set error message in Material UI Snackbar
            }
        })
    }

    // useEffect keeps the state up-to-date, users to be updated after state change
    useEffect(() => {
        getAllUsers();
    }, []);

    return (
        <>
            <Card> {/* Use Material UI Card element */}
                <Card.Header>
                    <Badge badgeContent={users.length} color="secondary">
                        <PeopleAlt />
                    </Badge>
                </Card.Header>
                <Card.Body>
                    <Table bordered hover striped variant="light">
                        <thead>
                        <tr>
                            <th>Created At</th>
                            <th>Updated At</th>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Options</th>
                        </tr>
                        </thead>
                        <tbody>
                            {
                            users.map((user) => ( // Map users in table
                                <tr key={user.id}>
                                    <td>{user.createdAt}</td>
                                    <td>{user.updatedAt}</td>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td align="center">
                                        <ButtonGroup>
                                            <Button size="sm" variant="outline-success mr-1"><Person /></Button>
                                            <Link to={"edituser/" + user.id}
                                                className="btn btn-sm btn-outline-primary mr-1"><Edit />
                                            </Link>
                                            <Button size="sm" variant="outline-danger" onClick={deleteUser.bind(this, user.id)}><Delete  /></Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
            { // In case of an error, show error snackbar, close after 6 seconds, show in the top-right corner of the screen
                error && (
                    <div className={classes.root}>
                        <Snackbar
                            open={open}
                            autoHideDuration={6000}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}>
                            <Alert onClose={handleClose} severity="error">
                                {error}
                            </Alert>
                        </Snackbar>
                    </div>
                )
            }
            { // In case of success, show success snackbar, close after 6 seconds, show in the top right corner of the screen
                success && (
                    <div className={classes.root}>
                        <Snackbar
                            open={open}
                            autoHideDuration={6000}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}>
                            <Alert onClose={handleClose} severity="success">
                                User deleted successfully
                            </Alert>
                        </Snackbar>
                    </div>
                )
            }
            <AddUser />
        </>
    );
}

export default UserList;

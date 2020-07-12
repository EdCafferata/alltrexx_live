import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Import Formik and Yup components for creation of forms
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Import Material UI components for styling
import { Grid, Snackbar, Button } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';

// Import Authentication Service for login credential validation
import AuthService from '../../services/AuthService';

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

// React Login component
const Login = () => {
    // React Hooks State Management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    // Material UI Snackbar close function
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Formik
            initialValues={{ // Setting form initial values for username and password
                username: '',
                password: ''
            }}
            validationSchema={ Yup.object({ // Setting validation schema for form validation via Yup
                username: Yup.string()
                    .min(3, 'Must be 3 characters or more')
                    .max(25, 'Must be 25 characters or less')
                    .matches(/^[a-zA-ZäáàëéèöüÄÁÀÉÈÖÜñß]{3,}$/, 'The username must consist of letters only') // Regular expression to secure form field
                    .required('Required'),
                password: Yup.string()
                    .min(8, 'Must be at least 8 characters or more')
                    .max(125, 'Must be 125 characters or less')
                    .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*?[#?!@$%^&*-]).{8,}/, '8 characters, 1 capital, 1 small, 1 special and a number.') // Regular expression to secure form field
                    .required('Required'),
            })}
            onSubmit={(values) => { // Handle form login request upon submission
                AuthService.login(values.username, values.password).then(
                    () => {
                        setLoading(true);
                        setError(null);
                        setTimeout(() => { // Time-out before redirect to the profile page
                            window.location.assign("/profile");
                        }, 1000);
                        setSuccess(true); // Activate success Material UI Snackbar
                        setOpen(true); // Open Material UI Snackbar
                    },
                    error => { // In case of an error:
                        const errMessage =
                            (error.response &&
                                error.response.data &&
                                error.response.data.message) ||
                            error.message ||
                            error.toString();
                        setLoading(false); // Do not show loading icon in button
                        setOpen(true); // Open Material UI Snackbar
                        setError(errMessage); // Set error message in Material UI Snackbar
                    }
                )
            }}
        >
            <Grid
                container
                direction="column"
                justify="center"
                alignItems="center"
            >
                {/* Material UI Grid */}
                <div className="card card-container">
                    <h3>Log In to Your Account</h3><br />
                    {/* Show Admin Login credentials via an alert */}
                    <Alert variant="standard" severity="info"><strong>Username: </strong>admin<br /> <strong>Password: </strong>AdminPass123!</Alert>
                    <br />
                    <Form>
                        <div className="form-group">
                            <label htmlFor="username">Username</label><br />
                            <Field className="form-control" name="username" type="text" required/>
                            <ErrorMessage name="username" component={Alert} /> {/* Show Error message in an alert */}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label><br />
                            <Field className="form-control" name="password" type="password" required />
                            <ErrorMessage name="password" component={Alert} />
                        </div>
                        <div className="form-group">
                            <Button type="submit" variant="contained" color="primary" fullWidth={true}>
                                {
                                    loading && <span className="spinner-border spinner-border-sm"/>
                                }
                                <span>Login</span>
                            </Button>
                            <br /><br />
                            Not registered? <Link to="/register">  Register here</Link>
                            <br />

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
                                                Log In successful
                                            </Alert>
                                        </Snackbar>
                                    </div>
                                )
                            }
                        </div>
                    </Form>
                </div>
            </Grid>
        </Formik>
    );
}
export default Login;

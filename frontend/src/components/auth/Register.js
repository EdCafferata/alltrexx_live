import React, {useState} from 'react';
import { Link } from 'react-router-dom';

// Import Formik and Yup components for creation of forms
import { ErrorMessage, Field, Form, Formik } from 'formik';
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

// React Register component
const Register = () => {
    // React Hooks State Management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    // Material UI Snackbar close function
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Formik
            initialValues={{ // Setting form initial values for first-, last-, username, email and password
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                password: '',
                confirmPassword: ''
            }}
            validationSchema={ Yup.object({  // Setting validation schema for form validation via Yup
                firstName: Yup.string()
                    .min(2, 'Must be 2 characters or more')
                    .max(25, 'Must be 25 characters or less')
                    .matches(/^[A-zäáàëéèöüÄÁÀÉÈÖÜñß\s-]{2,}$/, 'Only letters, spaces and - are allowed') // Regular expression to secure form field
                    .required('Required'),
                lastName: Yup.string()
                    .min(2, 'Must be 2 characters or more')
                    .max(25, 'Must be 25 characters or less')
                    .matches(/^[A-zäáàëéèöüÄÁÀÉÈÖÜñß\s-]{2,}$/, 'Only letters, spaces and - are allowed')
                    .required('Required'),
                username: Yup.string()
                    .min(3, 'Must be 3 characters or more')
                    .max(25, 'Must be 25 characters or less')
                    .matches(/^[A-zäáàëéèöüÄÁÀÉÈÖÜñß]{3,}$/, 'Your username must consist of letters only')
                    .required('Required'),
                email: Yup.string()
                    .max(50, 'Must be 50 characters or less')
                    .matches(/^[A-z0-9._-]+@[A-z0-9.-]+\.[A-z]{2,4}$/, 'This is not a valid email address')
                    .required('Required'),
                password: Yup.string()
                    .min(8, 'Must be at least 8 characters or more')
                    .max(125, 'Must be 125 characters or less')
                    .matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*?[#?!@$%^&*-]).{8,}/, 'The password must consist of at least 8 characters. Containing 1 capital letter, 1 small letter, 1 special character and a number.')
                    .required('Required'),
                confirmPassword: Yup.string()
                    .required('confirm')
                    .oneOf([Yup.ref("password"), null], "Passwords must match")
            })}
            onSubmit={(values) => { // Handle form register request upon submission
                AuthService.register(values.username, values.email, values.password).then(
                    () => {
                        setLoading(true);
                        setTimeout(() => { // Time-out before redirect to the login page
                            window.location.assign("/login");
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

                        setLoading(false); // Do no show loading icon in button
                        setOpen(true); // Open Material UI Snackbar
                        setError(errMessage); // Set error message
                    }
                )
            }}
        >
            <Grid
                container
                direction="column"
                justify="center"
                alignItems="center"
            > {/* Material UI Grid */}
                <div className="card card-container">
                    <h3>Register Your Account</h3><br />
                    <Form>
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label><br />
                            <Field className="form-control" name="firstName" type="text" required />
                            <ErrorMessage name="firstName" component={Alert} /> {/* Show Error message in an alert */}
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label><br />
                            <Field className="form-control" name="lastName" type="text" required />
                            <ErrorMessage name="lastName" component={Alert} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">Username</label><br />
                            <Field className="form-control" name="username" type="text" required />
                            <ErrorMessage name="username" component={Alert} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label><br />
                            <Field className="form-control" name="email" type="text" required />
                            <ErrorMessage name="email" component={Alert} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label><br />
                            <Field className="form-control" name="password" type="password" required />
                            <ErrorMessage name="password" component={Alert} />
                        </div>
                            {/* 1. Confirm Password field has been added.

                                2. Helps the user to check the first typed password.

                            */}

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label><br />
                            <Field className="form-control" name="confirmPassword" type="password" required />
                            <ErrorMessage name="confirmPassword" component={Alert} />
                        </div>

                        <div className="form-group">
                            <Button type="submit" variant="contained" color="primary" fullWidth={true}>
                                {
                                    loading && <span className="spinner-border spinner-border-sm"/>
                                }
                                <span>Register</span>
                            </Button>
                            <br /><br />
                            Already registered? <Link to="/login">Login here</Link>
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
                                                You have been successfully registered
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

export default Register;

import React, {useState} from 'react';

// Import Formik and Yup components for creation of forms
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from "yup";

// Import Material UI components for styling
import { Grid, Card, Button, Snackbar } from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import { makeStyles } from "@material-ui/core/styles";

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
    },
    card: {
        width: "100%",
        minWidth: 275,
        padding: theme.spacing(2)
    },
    item: {
        padding: theme.spacing(1)
    }
}));

// React AddUser component
const AddUser = () => {
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
      <>
        <Formik
            initialValues={{ // Setting form initial values for first-, last-, username, email and password
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                password: ''
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
            })}
            onSubmit={(values) => { // Handle form register request upon submission
                AuthService.register(values.username, values.email, values.password).then(response => {
                    if(response.data != null) {
                        setLoading(true);
                        setSuccess(true); // Activate success Material UI Snackbar
                        setOpen(true); // Open Material UI Snackbar;
                        window.location.assign("/userlist");
                    }
                },
                    error => { // In case of an error:
                        const errMessage =
                            (error.response &&
                                error.response.data &&
                                error.response.data.message) ||
                            error.message ||
                            error.toString();

                        setLoading(false);
                        setOpen(true); // Open Material UI Snackbar
                        setError(errMessage); // Set error message in the Material UI Snackbar
                    }
                )
            }}
        >
          <Card className={classes.card}> {/* Material UI Card */}
            <Form>
                <p>Na reload verwijst de on submit event naar een lege pagina, er dient opnieuw naar de userlist pagina genavigeerd te worden. </p>
            <Grid container> {/* Material UI Grid */}
                <Grid item xs={2} className={classes.item}>
                  <div className="float"> {/* Activate floating label via App.css */}
                      <Field className="form-control" name="firstName" type="text" required />
                      <label htmlFor="firstName">First Name</label>
                      <ErrorMessage name="firstName" component={Alert} /> {/* Show Error message in an alert */}
                  </div>
                </Grid>
                <Grid item xs={2} className={classes.item}>
                  <div className="float">
                      <Field className="form-control" name="lastName" type="text" required />
                      <label htmlFor="lastName">Last Name</label>
                      <ErrorMessage name="lastName" component={Alert} />
                  </div>
                </Grid>
                <Grid item xs={2} className={classes.item}>
                  <div className="float">
                      <Field className="form-control" name="username" type="text" required />
                      <label htmlFor="username">Username</label>
                      <ErrorMessage name="username" component={Alert} />
                  </div>
                </Grid>
                <Grid item xs={2} className={classes.item}>
                  <div className="float">
                      <Field className="form-control" name="email" type="text" required />
                      <label htmlFor="email">Email Address</label>
                      <ErrorMessage name="email" component={Alert} />
                  </div>
                </Grid>
                <Grid item xs={2} className={classes.item}>
                  <div className="float">
                      <Field className="form-control" name="password" type="password" required />
                      <label htmlFor="password">Password</label>
                      <ErrorMessage name="password" component={Alert} />
                  </div>
                </Grid>
                <Grid item xs={2} className={classes.item}>
                  <Button type="submit" variant="contained" color="primary" fullWidth={true}>
                    {
                        loading && <span className="spinner-border spinner-border-sm"/>
                    }
                    <span>Add</span>
                  </Button>
                </Grid>
                </Grid>
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
                                  User is successfully registered
                              </Alert>
                          </Snackbar>
                      </div>
                    )
                  }
            </Form>
          </Card>
        </Formik>
      </>
    );
}

export default AddUser;

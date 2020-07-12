import React, { Fragment } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

// Import Material UI components for styling
import { AppBar, Button, Toolbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// Use CSS styling from Boards.css
import "./Boards.css";

// Import other React components
import User from '../users/User';
import UserList from '../users/UserList';

// Material UI Styling settings
const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
            color: "#ffffff",
        },
    },
}));

// React AdminBoard component
const AdminBoard = () => {
    const classes = useStyles();

    return(
        <Fragment>
            <Router>
                <AppBar position="static"> {/* Material UI navigation bar */}
                    <Toolbar className={classes.root}> {/* Call Material UI styling settings */}
                        <Link to={"/"}>
                            <Button variant="outlined">
                                Admin Board
                            </Button>
                        </Link>
                        <Link to={"userlist"}>
                            <Button variant="outlined">
                                User List
                            </Button>
                        </Link>
                    </Toolbar>
                </AppBar>
                <Switch>
                    <Route exact path="/edituser/:id" component={User} />
                    <Route exact path="/userlist" component={UserList} />
                </Switch>
            </Router>
            <p>Hier komen statistieken over aantal users, nieuw geregistreerde users per periode etc.</p>
        </Fragment>
    )
}

export default AdminBoard;

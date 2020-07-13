import React, { useState, useEffect } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

// Import React components needed
import AuthService from '../../services/AuthService';
import OpenStreetSeaMap from '../OpenStreetSeaMap';
import searchSchip from '../searchSchips';
import searchAisDatas from '../searchAisDatas';
import { Login, Register } from "../auth";
import { AdminBoard, ModeratorBoard, UserBoard } from '../boards';

// React Router component
const Router = () => {
    // React hooks state management
    const [currentUser, setCurrentUser] = useState(undefined);

    // If a user is logged in, set the user
    useEffect(() => {
        const user = AuthService.getCurrentUser();

        if (user) {
            setCurrentUser(AuthService.getCurrentUser());
        }
    }, []);

    const ProtectedRoute = ({ component: Component, ...rest }) => ( // ProtectedRoute is a component with props
        <Route
            {...rest} render={props => {
            if (currentUser !== undefined) { // If a user is logged in
                return <Component {...props} />; // Return the component and set (spread) the props
            } else {
                return <Redirect to="/login"/>; // Otherwise redirect to the login page
            }
        }} />
    )

    return(
        <Switch> {/* Create a switch frame, a frame in which component views can be switched */}
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact  path="/" component={OpenStreetSeaMap} />
            <Route exact  path="/searchschip" component={searchSchip} />
            <Route exact  path="/searchaisdatas" component={searchAisDatas} />
            <ProtectedRoute exact path="/user" component={UserBoard} />
            <ProtectedRoute exact path="/mod" component={ModeratorBoard} />
            <ProtectedRoute exact path="/admin" component={AdminBoard} />
        </Switch>
    )
}

export default Router;

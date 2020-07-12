import React from 'react';
import {Toast} from 'react-bootstrap';

// React UserToast Component, element from bootstrap
class UserToast extends React.Component {
    render() {
        return (
            <div id="Box">
                <Toast className={`border text-white ${this.props.type === "success" ? "border-success bg-success" : "border-danger bg-danger"}`} show={this.props.show}>
                    <Toast.Header className={`text-white ${this.props.type === "success" ? "bg-success" : "bg-danger"}`}>
                        <strong className="mr-auto">Success</strong>
                    </Toast.Header>
                    <Toast.Body>
                        {this.props.message}
                    </Toast.Body>
                </Toast>
            </div>
        );
    }
}

export default UserToast;

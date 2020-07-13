import * as React from 'react';
import { Fragment } from 'react';
import Button from '@material-ui/core/Button';
import { BulkDeleteButton } from 'react-admin';
import searchSchipsResetViewsButton from './searchSchipsResetViewsButton';

const searchSchipsPostBulkActionButtons = props => (
    <Fragment>
        <searchSchipsResetViewsButton label="Toon Schepen" {...props} />
        {/* default bulk action */}
        <BulkDeleteButton {...props} title="Toon nieuwe selectie op de kaart" />
    </Fragment>
);
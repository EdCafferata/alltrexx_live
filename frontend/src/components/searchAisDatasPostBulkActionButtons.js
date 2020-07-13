import * as React from 'react';
import { Fragment } from 'react';
import Button from '@material-ui/core/Button';
import { BulkDeleteButton, bulkSaveButton } from 'react-admin';
import searchAisResetViewsButton from './searchAisDatasResetViewsButton';

const searchAisPostBulkActionButtons = props => (
    <Fragment>
        <searchAisResetViewsButton {...props} label="Toon aisgegevens van de schepen op de kaart" />
        {/* default bulk action */}
        <BulkDeleteButtonButton {...props} />
    </Fragment>
);
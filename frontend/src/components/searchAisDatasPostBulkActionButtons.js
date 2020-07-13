import * as React from 'react';
import { Fragment } from 'react';
import Button from '@material-ui/core/Button';
import { BulkDeleteButton } from 'react-admin';
import searchAisResetViewsButton from './searchAisDatasResetViewsButton';

const searchAisPostBulkActionButtons = props => (
    <Fragment>
        <searchAisResetViewsButton label="Toon aisgegevens van de schepen op de kaart" {...props} />
        {/* default bulk action */}
        <BulkDeleteButton {...props} title="Toon nieuwe selectie op de kaart" />
    </Fragment>
);
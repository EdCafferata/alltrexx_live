import * as React from "react";
import { List, Datagrid, TextField } from 'react-admin';

export const searchSchipsPostList = (props) => (
    <List {...props} title="RNH & YSY Schepen ">
        <Datagrid>
            <TextField source="naamschipper" />
            <TextField source="aisnummer" />
            <TextField source="naamschip" />
            <TextField source="klasse" />
            <TextField source="scheepstype" />
            <TextField source="swrating" />
        </Datagrid>
    </List>
);
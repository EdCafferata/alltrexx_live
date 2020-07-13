import * as React from "react";
import { List, Datagrid, TextField, } from 'react-admin';

export const searchAisPostList = (props) => (
    <List {...props} title="RNH & YSY Schepen tracks / locaties" >
        <Datagrid>
            <TextField source="aisnummer" />
            <TextField source="status" />
            <TextField source="speed" />
            <TextField source="lon" />
            <TextField source="lat" />
            <TextField source="course" />
            <TextField source="heading" />
            <TextField source="timestamp" />
            <TextField source="ship_id" />
        </Datagrid>
    </List>
);
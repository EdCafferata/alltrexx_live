import * as React from "react";
import { Admin, Resource } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { searchSchipsPostList } from './searchSchipsPostList';

const searchSchips = () => (
    <Admin dataProvider={jsonServerProvider('http://localhost:8080')}>
        <Resource name="api/schips/" getlist={searchSchipsPostList} />
    </Admin>
);

export default searchSchips;
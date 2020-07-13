import * as React from "react";
import { Admin, Resource } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { searchSchipsPostList } from './searchSchipsPostList';

const searchSchips = () => (
    <Admin dataProvider={jsonServerProvider('http://jsonplaceholder.typicode.com')}>
        <Resource name="posts" list={searchSchipsPostList} />
    </Admin>
);

export default searchSchips;
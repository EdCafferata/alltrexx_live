import * as React from "react";
import { Admin, Resource } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { PostList } from './searchSchipsPostList';

const searchSchips = () => (
    <Admin dataProvider={jsonServerProvider('http://jsonplaceholder.typicode.com')}>
        <Resource name="posts" list={PostList} />
    </Admin>
);

export default searchSchips;
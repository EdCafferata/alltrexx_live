import * as React from "react";
import { Admin, Resource } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { searchAisPostList } from './searchAisDatasPostList';

const searchAisDatas = () => (
    <Admin dataProvider={jsonServerProvider('http://jsonplaceholder.typicode.com')}>
        <Resource name="posts" list={searchAisPostList} />
    </Admin>
);

export default searchAisDatas;




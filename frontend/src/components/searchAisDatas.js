import * as React from "react";
import { Admin, Resource } from 'react-admin';
import jsonServerProvider from 'ra-data-json-server';
import { searchAisPostList } from './searchAisDatasPostList';

const searchAisDatas = () => (
    <Admin dataProvider={jsonServerProvider('http://localhost:8080')}>
        <Resource name="api/aisdatas/1" getlist={searchAisPostList} />
    </Admin>
);

export default searchAisDatas;




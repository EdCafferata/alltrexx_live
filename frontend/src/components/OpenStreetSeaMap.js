import './App.css';
import React from "react";
import { Map, Marker, Popup, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import markersData from "./OpenstreetSeaMap-import.json";
import NmScale from "@marfle/react-leaflet-nmscale";

const markersdata = markersData

export const icon = new Icon({
    iconUrl: './zeilboot.jpg',
    iconSize: [24, 24]
});

export default function App() {
    const [activeSeaMap, setActiveSeaMap] = React.useState(null);

    return (
        <Map center={[52.458510, 4.561492]} zoom={9}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        <TileLayer
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

                <NmScale />

        {markersdata.map(markers => (
                <Marker
            key={markers.aisnummer}
            position={[
                    markers.lat,
                markers.lon
]}
    onClick={() => {
        setActiveSeaMap(markers);
    }}

    icon={icon}

    />
))}

    {activeSeaMap && (
    <Popup
        position={[
                activeSeaMap.lat,
            activeSeaMap.lon
    ]}
        onClose={() => {
        setActiveSeaMap(null);
    }}
    >
    <div>
    <h2>{activeSeaMap.aisnummer}</h2>
    <strong>speed : {activeSeaMap.speed} </strong>
    <br /><>lon : {activeSeaMap.lon} </>
    <br /><>lat :  {activeSeaMap.lat} </>
    <br /><>course: {[activeSeaMap.course]} </>
    <br /><>heading: {[activeSeaMap.heading]} </>
    <br /><>timestamp: {[activeSeaMap.timestamp]} </>
    <br /><>ship_id: {[activeSeaMap.ship_id]} </>
    <br /><>status: {[activeSeaMap.status]} </>
    </div>
    </Popup>
    )}
</Map>
);
}
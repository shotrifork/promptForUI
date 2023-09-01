import "leaflet/dist/leaflet.css";

import React, { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

const Map = ({ coord }) => {
  useEffect(() => {
    // This is where you could do any additional setup or fetch data
  }, []);

  return (
    <MapContainer
      center={coord}
      zoom={13}
      style={{ width: "320px", height: "180px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  );
};

export default Map;

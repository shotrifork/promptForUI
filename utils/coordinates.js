import * as turf from "@turf/turf";

import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

export const getDistanceBetweenAddresses = async (from, to) => {
  const fromCoord = await getCoordinates(from);
  const toCoord = await getCoordinates(to);

  const distance = await getDistanceBetweenAddressesUsingTurf(
    fromCoord,
    toCoord
  );
  const dist = distance.toFixed(2);
  const content = `<h2>Afstand mellem ${from} og ${to} i luftlinje er ca. ${dist} km</h2>`;
  console.log(content, dist);
  return { content, fromCoord, toCoord, dist };
};

export async function getCoordinates(address) {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${MAPBOX_TOKEN}`
  );

  const [longitude, latitude] = response.data.features[0].geometry.coordinates;
  return { longitude, latitude };
}

export async function getDistanceBetweenAddressesUsingTurf(coords1, coords2) {
  const from = turf.point([coords1.longitude, coords1.latitude]);
  const to = turf.point([coords2.longitude, coords2.latitude]);
  const options = { units: "kilometers" };

  const distance = turf.distance(from, to, options);
  console.log(`distance: ${distance}`);
  return distance;
}

export const getDistanceBetweenAddressesDescription = () => {
  return {
    name: "getDistanceBetweenAddresses",
    description: "The user wants to get the distance between two locations",
    parameters: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description:
            "The address of the 'from' location, for instance Grenåvej 11, 8541 Skødstrup, Danmark",
        },
        to: {
          type: "string",
          description:
            "The address of the 'from' location, for instance Grenåvej 11, 8541 Skødstrup, Danmark",
        },
      },
      required: ["from", "to"],
    },
  };
};

function haversineDistance(coord1, coord2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = degreesToRadians(coord2.latitude - coord1.latitude);
  const dLon = degreesToRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(coord1.latitude)) *
      Math.cos(degreesToRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

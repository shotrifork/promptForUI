// utils/myEndpoint.js
import yelp from "yelp-fusion";

// get apiKey from environment variabel YELP_API_KEY
const apiKey = process.env.YELP_API_KEY;

const client = yelp.client(apiKey);

export async function fetchYelpData(term = "kaffe", location = "Aarhus") {
  const searchRequest = {
    term,
    location,
  };

  try {
    const response = await client.search(searchRequest);
    console.dir(response);
    return response.jsonBody.businesses[0];
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const getFetchYelpDataDescription = () => {
  return {
    name: "fetchYelpData",
    description: "Get useful information about businessen at a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g., New York, NY",
        },
        term: {
          type: "string",
          description:
            "Search term, e.g. 'food' or 'restaurants'. The term may also be the business's name, such as 'Starbucks'. If term is not included the endpoint will default to searching across businesses from a small number of popular categories.",
          default: "coffee",
        },
      },
      required: ["location"],
    },
  };
};

export const parseYelpSearchResponse = (response, location, term) => {
  if (response !== undefined && response !== null) {
    const useful = {
      name: response.name,
      image_url: response.image_url,
      url: response.url,
      review_count: response.review_count,
      rating: response.rating,
      coordinates: response.coordinates,
      price: response.price,
      location: response.location,
      phone: response.phone,
      display_phone: response.display_phone,
      distance: response.distance,
    };
    let distance = useful.distance;
    if (distance > 1000) {
      distance = `${Math.round(distance / 1000)} km`;
    } else {
      distance = `${Math.round(distance)} m`;
    }

    const address = `${useful.location.display_address.join(", ")}`;
    const info = `${useful.display_phone} - ${distance} fra ${location}`;
    const description = `${useful.name} - ${address} - ${info}`;
    return `Prøv her: ${description}`;
  } else {
    return `Jeg kunne desværre ikke finde noget om "${term}" i ${location}`;
  }
};

const exampleResponse = {
  id: "cPGMjQWWH4rzCO33P-w_vw",
  alias: "stillers-coffee-aarhus",
  name: "Stillers Coffee",
  image_url:
    "https://s3-media4.fl.yelpcdn.com/bphoto/VxyCLJfy33Bl-Cu2xPKoIQ/o.jpg",
  is_closed: false,
  url: "https://www.yelp.com/biz/stillers-coffee-aarhus?adjust_creative=t0prLk7JoERb9CtgDcdMSA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=t0prLk7JoERb9CtgDcdMSA",
  review_count: 17,
  categories: [
    { alias: "coffee", title: "Coffee & Tea" },
    { alias: "cafes", title: "Cafes" },
  ],
  rating: 4.5,
  coordinates: { latitude: 56.15891, longitude: 10.20667 },
  transactions: [],
  price: "$",
  location: {
    address1: "Klostergade 32 H, st.",
    address2: "",
    address3: "",
    city: "Aarhus",
    zip_code: "8000",
    country: "DK",
    state: "82",
    display_address: ["Klostergade 32 H, st.", "8000 Aarhus", "Denmark"],
  },
  phone: "+4528498323",
  display_phone: "+45 28 49 83 23",
  distance: 2644.541140535589,
};

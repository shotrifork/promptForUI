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
    return response.jsonBody;
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
  if (
    response !== undefined &&
    response !== null &&
    response.businesses.length > 0
  ) {
    let selectedBusiness = response.businesses[0];
    let openBusinesses = response.businesses.filter(
      (business) => business.is_closed === false
    );
    const anyBusinessOpen = openBusinesses.length > 0;
    selectedBusiness = anyBusinessOpen ? openBusinesses[0] : selectedBusiness;

    const useful = {
      name: selectedBusiness.name,
      image_url: selectedBusiness.image_url,
      url: selectedBusiness.url,
      review_count: selectedBusiness.review_count,
      rating: selectedBusiness.rating,
      coordinates: selectedBusiness.coordinates,
      price: selectedBusiness.price,
      location: selectedBusiness.location,
      phone: selectedBusiness.phone,
      display_phone: selectedBusiness.display_phone,
      distance: selectedBusiness.distance,
    };
    let distance = useful.distance;
    if (distance > 1000) {
      distance = `${Math.round(distance / 1000)} km`;
    } else {
      distance = `${Math.round(distance)} m`;
    }

    const address = `${useful.location.display_address.join(", ")}`;
    const info = `<a href="phone:${useful.phone}">${useful.display_phone}</a> - ${distance} fra ${location}`;
    const description = `<a href="${useful.url}" target="_blank">${useful.name}</a> - ${address} - ${info}`;
    const preText = anyBusinessOpen
      ? `<h2>Jeg fandt ${openBusinesses.length} åbne steder Her er det første</h2>`
      : `<h2>Jeg fandt ${openBusinesses.length} steder, dog ingen åbne. Her er en der en, der dog er lukker nu.</h2>`;
    const postText = anyBusinessOpen ? ", den er åben nu" : "";
    const image = useful.image_url
      ? `<div><img style="width: 200px; margin: .5em 0;" src="${useful.image_url}" /></div>`
      : "";
    return `${preText}${image}<br/>${description}${postText}`;
  } else {
    return null;
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

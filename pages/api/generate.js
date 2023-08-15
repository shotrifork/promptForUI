import * as turf from "@turf/turf";

import { Configuration, OpenAIApi } from "openai";

import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
const OPEN_WEATHER_TOKEN = process.env.OPEN_WEATHER_TOKEN;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const functions = [
  {
    name: "getWeatherData",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g., New York, NY",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          default: "celsius",
        },
      },
      required: ["location", "unit"],
    },
  },
  {
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
  },
];
const messages = [
  {
    role: "system",
    content:
      "You server as a layer before the UI of a webapp. You role is to understand questions through a prompt and identify which functions need to be called and the ensure that relevant parameters exist. If a question falls out of known functions (get weather data and get distance), kindly advice the user to ask relevant question. Update and correct the given locations so that they are correct, for instance Hærning should be Herning. Der samtales på Dansk.",
  },
];

const functionsFound = [];

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  const prompt = req.body.prompt || "";
  if (prompt.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid prompt",
      },
    });
    return;
  }
  messages.push({
    role: "user",
    content: prompt,
  });

  try {
    console.dir(messages);
    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
      functions,
      temperature: 0.6,
    });
    const chatCompletionNoFunctions = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.6,
    });
    const message = chatCompletion.data.choices[0].message;
    const messageNoFunctions =
      chatCompletionNoFunctions.data.choices[0].message;
    const functionUsed = {};
    console.log("message: " + JSON.stringify(messageNoFunctions, null, 2));

    if (message.function_call) {
      const name = message.function_call.name;
      const args = JSON.parse(message.function_call.arguments);
      functionUsed.name = name;
      functionUsed.args = args;
      functionUsed.result = {};

      if (name === "getDistanceBetweenAddresses") {
        const { from, to } = args;

        try {
          const c1 = await getCoordinates(from);
          const c2 = await getCoordinates(to);

          const coord1 = { lat: c1[0], lon: c1[1] };
          const coord2 = { lat: c2[0], lon: c2[1] };

          const distance = haversineDistance(coord1, coord2);
          const dist = distance.toFixed(2);
          functionUsed.result[from] = coord1;
          functionUsed.result[to] = coord2;
          functionUsed.result.dist = dist;

          const content = `Afstand mellem ${from} og ${to} i luftlinje er ca. ${dist} km`;
          message.content = content;
          functionsFound.push(message.content);
        } catch (e) {
          message.content = e.message;
        }
      } else if (name === "getWeatherData") {
        const { location, unit } = args;
        try {
          const data = await getWeatherData(location, unit);
          functionUsed.result = data;
          const content = `Temperatur i ${location} er ca. ${Math.round(
            data.temperature - 273.15
          )} °, det er ${data.description} med en luftfugtighed på ${
            data.humidity
          }`;
          message.content = content;
          functionsFound.push(message.content);
        } catch (e) {
          message.content = e.message;
        }
      }
      messages.push(message);
    } else {
      messages.pop();
      message.content =
        "Jeg er optimeret til at hjælpe med to opgaver: Find vejret for en by eller afstanden imellem to byer.";
    }

    console.dir(messages);

    res.status(200).json({ result: { ...message, functionUsed } });

    /*
      {
    role: 'assistant',
    content: null,
    function_call: {
      name: 'getDistanceBetweenAddresses',
      arguments: '{\n  "from": "Viborg",\n  "to": "Randers"\n}'
    }
  }
  */
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}

function generatePrompt(animal) {
  const capitalizedAnimal =
    animal[0].toUpperCase() + animal.slice(1).toLowerCase();
  return `Foreslå et dansk navn for tre dyr der er super søde

Dyr: Kat
Navne: Shiva, Misser, Hans
Dyr: Hund
Navne: Vaks, Paw, Pluto
Dyr: ${capitalizedAnimal}
Navne:`;
}

export async function getCoordinates(address) {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${MAPBOX_TOKEN}`
  );
  const [longitude, latitude] = response.data.features[0].geometry.coordinates;
  return [latitude, longitude];
}

export async function getDistanceBetweenAddresses(address1, address2) {
  const coords1 = await getCoordinates(address1);
  const coords2 = await getCoordinates(address2);
  console.log(address1, coords1);
  console.log(address2, coords2);
  const from = turf.point(coords1);
  const to = turf.point(coords2);
  const options = { units: "kilometers" };

  const distance = turf.distance(from, to, options);
  console.log(`distance: ${distance}`);
  return distance;
}

async function getWeatherData(location, units) {
  try {
    const [lon, lat] = await getCoordinates(location);

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_TOKEN}&units=${units}&lang=da`;
    console.log(url);

    const response = await axios.get(url);
    const data = response.data;

    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      // ... any other data you want
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

function haversineDistance(coord1, coord2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = degreesToRadians(coord2.lat - coord1.lat);
  const dLon = degreesToRadians(coord2.lon - coord1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(coord1.lat)) *
      Math.cos(degreesToRadians(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

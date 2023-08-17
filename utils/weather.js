import axios from "axios";
import { getCoordinates } from "./coordinates";
const OPEN_WEATHER_TOKEN = process.env.OPEN_WEATHER_TOKEN;

export const getWeatherData = async (location, units) => {
  try {
    const { longitude, latitude } = await getCoordinates(location);

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_TOKEN}&units=${units}&lang=da`;
    console.log(url);

    const response = await axios.get(url);
    const data = response.data;

    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
};

export const getWeatherDataDescription = () => {
  return {
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
  };
};

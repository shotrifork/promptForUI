import axios from "axios";
import { getCoordinates } from "./coordinates";
const OPEN_WEATHER_TOKEN = process.env.OPEN_WEATHER_TOKEN;

export const getWeatherData = async (location, units) => {
  try {
    const { longitude, latitude } = await getCoordinates(location);

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_TOKEN}&units=${units}&lang=da`;
    console.log(url);

    const response = await axios.get(url);

    const useful = {
      location: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
    };
    const result = `<h2>Temperatur i ${location} er ca. ${Math.round(
      useful.temperature - 273.15
    )} °</h2>
    Det er ${useful.description} med en luftfugtighed på ${useful.humidity}%`;
    return result;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
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

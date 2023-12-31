import { Configuration, OpenAIApi } from "openai";
import {
  getDistanceBetweenAddresses,
  getDistanceBetweenAddressesDescription,
} from "../../utils/coordinates";
import { getWeatherData, getWeatherDataDescription } from "../../utils/weather";
import {
  fetchYelpData,
  getFetchYelpDataDescription,
  parseYelpSearchResponse,
} from "../../utils/yelp";

import requestIp from "request-ip";
import { getIPInfo } from "../../utils/ipinfo";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const functions = [
  getWeatherDataDescription(),
  getDistanceBetweenAddressesDescription(),
  getFetchYelpDataDescription(),
];
console.log(functions);
const messages = [
  {
    role: "system",
    content:
      "You server as a layer before the UI of a webapp. You role is to understand questions through a prompt and identify which functions need to be called and the ensure that relevant parameters exist. If a question falls out of known functions (get weather data, get distance or get useful informations about businesses), kindly advice the user to ask relevant question. Update and correct the given locations so that they are correct, for instance Hærning should be Herning. Der samtales på Dansk. Hvis du er i tvivl om land, så brug Danmark",
  },
];

const functionsFound = [];

export default async function handler(req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  const userIP = requestIp.getClientIp(req);
  const ipInfo = await getIPInfo(userIP);
  const country = ipInfo.country ?? "DK";

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
    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
      functions,
      temperature: 0.6,
    });
    const message = chatCompletion.data.choices[0].message;
    const functionUsed = {};

    let foundResult = false;
    let image;
    let extra = {};

    if (message.function_call) {
      const name = message.function_call.name;
      const args = JSON.parse(message.function_call.arguments);
      functionUsed.name = name;
      functionUsed.args = args;
      functionUsed.result = {};

      if (name === "getDistanceBetweenAddresses") {
        const { from, to } = args;

        try {
          const { content, fromCoord, toCoord, dist } =
            await getDistanceBetweenAddresses(from, to);
          functionUsed.result[from] = fromCoord;
          functionUsed.result[to] = toCoord;
          functionUsed.result.dist = dist;

          message.content = content;
          functionsFound.push(message.content);
          foundResult = true;
        } catch (e) {
          message.content = e.message;
        }
      } else if (name === "getWeatherData") {
        const { location, unit } = args;
        try {
          const { result, raw } = await getWeatherData(location, unit);
          extra.coord = raw.coord;
          if (result !== null) {
            functionUsed.result = result;
            message.content = result;
            functionsFound.push(message.content);
            foundResult = true;

            console.log(raw);

            // try {
            //   image = await getImage(message.content);
            // } catch (e) {
            //   console.error(e);
            // }
          }
        } catch (e) {
          message.content = e.message;
        }
      } else if (name === "fetchYelpData") {
        try {
          const { location, term } = args;
          const result = await fetchYelpData(term, location);
          if (result !== null && result.total > 0) {
            functionUsed.result = result;
            message.content = parseYelpSearchResponse(result, location, term);
            functionsFound.push(message.content);
            foundResult = true;
          } else {
            message.content = `Jeg kunne ikke finde nogle resultater for ${term} i ${location}`;
          }
        } catch (e) {
          message.content = e.message;
        }
      }
      if (foundResult) {
        messages.push(message);
      }
    } else {
      messages.pop();
      message.content =
        "<h2>Jeg er optimeret til at hjælpe med tre opgaver</h2><ul><li>Find vejret for en by</li><li>Find afstanden imellem to byer</li><li>Find nyttige oplysninger om forretninger ved lokationen</li></ul>";
    }

    console.dir({ result: { ...message, functionUsed, foundResult } });

    res.status(200).json({
      ...{ result: { ...message, functionUsed, foundResult, image, extra } },
    });
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

// const getImage = async (prompt) => {
//   const response = await openai.createImage({
//     prompt: `A simple abstract paper drawing of The temperature in Viborg is around 17°C. It's cloudy with a humidity of 55%.`,
//     n: 1,
//     size: "256x256",
//   });
//   return response.data.data[0].url;
// };

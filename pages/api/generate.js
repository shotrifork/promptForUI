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
      "You server as a layer before the UI of a webapp. You role is to understand questions through a prompt and identify which functions need to be called and the ensure that relevant parameters exist. If a question falls out of known functions (get weather data, get distance or get useful informations about businesses), kindly advice the user to ask relevant question. Update and correct the given locations so that they are correct, for instance Hærning should be Herning. Der samtales på Dansk.",
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
    const message = chatCompletion.data.choices[0].message;

    // const chatCompletionNoFunctions = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   messages,
    //   temperature: 0.6,
    // });
    // const messageNoFunctions =
    //   chatCompletionNoFunctions.data.choices[0].message;
    // console.log("message: " + JSON.stringify(messageNoFunctions, null, 2));

    const functionUsed = {};

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
        } catch (e) {
          message.content = e.message;
        }
      } else if (name === "getWeatherData") {
        const { location, unit } = args;
        try {
          const data = await getWeatherData(location, unit);
          functionUsed.result = data;

          const content = `Temperatur i ${location} ${
            data.location !== location ? ` (${data.location})` : ""
          } er ca. ${Math.round(data.temperature - 273.15)} °, det er ${
            data.description
          } med en luftfugtighed på ${data.humidity}`;
          message.content = content;
          functionsFound.push(message.content);
        } catch (e) {
          message.content = e.message;
        }
      } else if (name === "fetchYelpData") {
        try {
          const { location, term } = args;
          const information = await fetchYelpData(term, location);
          functionUsed.result = information;
          message.content = parseYelpSearchResponse(
            information,
            location,
            term
          );
          functionsFound.push(message.content);
        } catch (e) {
          message.content = e.message;
        }
      }
      messages.push(message);
    } else {
      messages.pop();
      message.content =
        "Jeg er optimeret til at hjælpe med tre opgaver: Find vejret for en by, find afstanden imellem to byer eller nyttige oplysninger om forretninger ved lokationen.";
    }

    console.dir(messages);

    res.status(200).json({ result: { ...message, functionUsed } });
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

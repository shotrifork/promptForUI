# Using OpenAIs functions 

This project is a simple web app that uses OpenAI's API functions to support adding the language understanding to an UI. The idea is that you use OpenAI's functions to detect the intent of the user's input, allowing the LLM to act as a sort of a "prompt for UI".

You can read the original setup, installation and startup instructions below.

## The functions

The functions which are available are:

* Distance between two cities
* The weather in a city
* Get information about shops using Yelp API.

## Requirements
You need some API keys to use the functions. You can get them from the following sites:
   
| Function | Key name | Link |
| -------- | -------- | ---- |
| OpenAI  | OPENAI_API_KEY | https://platform.openai.com/docs/quickstart |
| Distance | MAPBOX_TOKEN | https://docs.mapbox.com/help/getting-started/ |
| Weather  | OPEN_WEATHER_TOKEN | https://openweathermap.org/api |
| Yelp | YELP_API_KEY | https://docs.developer.yelp.com/docs/fusion-intro |
| IPInfo | IP_INFO_TOKEN | https://ipinfo.io/login |

## Hosting - suggestion: Netlify
If you let your code stay on Github you can use Netlify to host it. You can read more about it here: https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/


# Original README.md
This project is based on OpenAI API Quickstart - Node.js example app. The original README.md is below.

This is an example pet name generator app used in the OpenAI API [quickstart tutorial](https://platform.openai.com/docs/quickstart). It uses the [Next.js](https://nextjs.org/) framework with [React](https://reactjs.org/). Check out the tutorial or follow the instructions below to get set up.

![Text box that says name my pet with an icon of a dog](https://user-images.githubusercontent.com/10623307/213887080-b2bc4645-7fdb-4dbd-ae42-efce00d0dc29.png)


## Setup

1. If you don’t have Node.js installed, [install it from here](https://nodejs.org/en/) (Node.js version >= 14.6.0 required)

2. Clone this repository

3. Navigate into the project directory

   ```bash
   $ cd openai-quickstart-node
   ```

4. Install the requirements

   ```bash
   $ npm install
   ```

5. Make a copy of the example environment variables file

   On Linux systems: 
   ```bash
   $ cp .env.example .env
   ```
   On Windows:
   ```powershell
   $ copy .env.example .env
   ```
6. Add your [API key](https://platform.openai.com/account/api-keys) to the newly created `.env` file

7. Run the app

   ```bash
   $ npm run dev
   ```

You should now be able to access the app at [http://localhost:3000](http://localhost:3000)! For the full context behind this example app, check out the [tutorial](https://platform.openai.com/docs/quickstart).


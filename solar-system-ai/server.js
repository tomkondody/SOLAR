// Import required packages
const express = require("express");
const bodyParser = require("body-parser");
const  OpenAIApi = require("openai");
require("dotenv").config(); // Load environment variables

const app = express();
const port = 3000;
const cors = require("cors");
app.use(cors()); // Allow requests from different origins


// Middleware to parse JSON data
app.use(bodyParser.json());

// Configure OpenAI API with your API key
// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY, // Read the API key from .env
//   });
  const openai = new OpenAIApi({  apiKey: process.env.OPENAI_API_KEY}); // Pass the configuration to OpenAIApi
  

// Route to handle AI requests
app.post("/ask-planet", async (req, res) => {
  const { message, planet } = req.body; // Capture user message and planet name

  try {
    // Send the user's input and planet name to OpenAI GPT
    const completion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct", // Robust GPT model
      prompt: `You are the planet ${planet}. Respond to this message: "${message}"`,
      max_tokens: 150, // Limit the response length
    });

    const aiResponse = completion.choices[0].text.trim(); // Extract AI's reply
    res.json({ response: aiResponse }); // Send AI response back to the front-end
  } catch (error) {
    console.error(error); // Log any errors
    res.status(500).send("Something went wrong with the AI."); // Inform front-end of an error
  }
});

// Start the server
app.listen(port, () => {
  console.log(`AI server is running at http://localhost:${port}`);
});

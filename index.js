const express = require('express');  // Web framework for Node.js
const bodyParser = require('body-parser');  // Middleware to parse JSON bodies
const openai = require('openai');  // OpenAI library

// Set OpenAI API configuration
openai.configuration = {
  apiKey: process.env.OPENAI_API_KEY,  // Store your API key in Replit Secrets
};

const app = express();
app.use(bodyParser.json());  // Enable JSON parsing

// Webhook endpoint to handle Alexa requests
app.post('/webhook', async (req, res) => {
  // Log incoming requests for debugging
  console.log('Incoming Alexa request:', JSON.stringify(req.body, null, 2));

  try {
    const alexaRequest = req.body;

    // Handle LaunchRequest (when the skill is opened)
    if (alexaRequest.request.type === 'LaunchRequest') {
      console.log('LaunchRequest received');  // Debug log
      res.json({
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: 'Hello! Welcome to your personal assistant. How can I help you today?',
          },
          shouldEndSession: false,
        },
      });
    }
    // Handle IntentRequest (when a user asks something)
    else if (alexaRequest.request.type === 'IntentRequest') {
      console.log('IntentRequest received');  // Debug log

      // Extract user message from the intent's slot (if available)
      const userMessage = alexaRequest.request.intent.slots?.message?.value || 'Hello!';

      // Call the GPT API to generate a response
      const gptResponse = await openai.ChatCompletion.create({
        model: 'gpt-4',  // Use 'gpt-4' or 'text-davinci-003'
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 100,
      });

      const reply = gptResponse.choices[0].message.content.trim();
      console.log('GPT Response:', reply);  // Debug log

      // Send the GPT-generated response back to Alexa
      res.json({
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: reply,
          },
          shouldEndSession: false,  // Keep session open for follow-ups
        },
      });
    }
    // Handle unexpected requests (like SessionEndedRequest)
    else {
      console.log('Unexpected request type received:', alexaRequest.request.type);  // Debug log
      res.json({
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: 'Sorry, I didn’t understand that.',
          },
          shouldEndSession: true,
        },
      });
    }
  } catch (error) {
    console.error('Error handling Alexa request:', error);
    res.status(500).send('Something went wrong!');
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

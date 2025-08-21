import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import say from 'say';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send([]);
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("audios/intro_1.wav"),
          facialExpression: "sad",
          animation: "Crying",
        },
      ],
    });
    return;
  }
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `You are a virtual girlfriend. You will always reply with a JSON array of messages. With a maximum of 3 messages. Each message has a text, facialExpression, and animation property. The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default. The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.` }],
      },
      {
        role: "model",
        parts: [{ text: "Okay, I understand." }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.6,
      responseMimeType: "application/json", // This is important for JSON output
    },
  });

  const result = await chat.sendMessage(userMessage || "Hello");
  let messages = JSON.parse(result.response.text());
  if (messages.messages) {
    messages = messages.messages; // Gemini is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
  }
  console.log(messages);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    // generate audio file
    const fileName = `audios/message_${i}.mp3`; // The name of your audio file
    const textInput = message.text; // The text you wish to convert to speech
    const fileNameWav = `audios/message_${i}.wav`; // Temporary WAV file for say.js
    await new Promise((resolve, reject) => {
      say.export(textInput, null, 1, fileNameWav, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    message.audio = await audioFileToBase64(fileNameWav);
  }

  res.send({ messages });
});

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});

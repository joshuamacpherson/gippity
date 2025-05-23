import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = 5000;

app.use(express.json());

const chatHistory = [];

// only storing 20 msgs
const MAX_HISTORY = 20;

app.get("/", async (req, res) => {
  const userMessage = req.query.message;

  // in case i messed up anything in the frontend 
  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "Invalid message" });
  }

  // whatever prompt you want
  const systemPrompt = {
    role: "system",
    content: process.env.SYSTEM_PROMPT,
  };

  // your key here 
  const openai = new OpenAI({ apiKey: process.env.TOKEN });

  chatHistory.push({ role: "user", content: userMessage });

  // again only 20 msgs 
  const recentMessages = [systemPrompt, ...chatHistory.slice(-MAX_HISTORY)];

  // for cors, needs to go (not safe)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: recentMessages,
    stream: true,
  });

  let assistantReply = "";

  // streaminggggg
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      assistantReply += content;
      res.write(content);
    }
  }

  chatHistory.push({ role: "assistant", content: assistantReply });

  res.end();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

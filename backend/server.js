import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = 5000;

app.use(express.json());

const chatHistory = [];
const MAX_HISTORY = 20;

app.get("/", async (req, res) => {
  const userMessage = req.query.message;

  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "Invalid message" });
  }

  const systemPrompt = {
    role: "system",
    content: process.env.SYSTEM_PROMPT,
  };

  const openai = new OpenAI({ apiKey: process.env.TOKEN });

  chatHistory.push({ role: "user", content: userMessage });

  const recentMessages = [systemPrompt, ...chatHistory.slice(-MAX_HISTORY)];

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: recentMessages,
    stream: true,
  });

  let assistantReply = "";

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

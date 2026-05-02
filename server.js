import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, profile } = req.body;

    const prompt = `
Usuário:
Objetivo: ${profile?.objetivo}
Peso: ${profile?.peso}
Nível: ${profile?.nivel}

Pedido:
${message}
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: prompt
    });

    res.json({ answer: response.output_text });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao chamar IA" });
  }
});

app.listen(port, () => {
  console.log("Servidor FitSelf rodando...");
});
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

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend FitSelf IA ativo." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, profile } = req.body;

    const prompt = `
Você é a IA oficial do FitSelf.

Monte respostas SEMPRE usando todos os dados abaixo.
Não diga que faltam idade, sexo, peso ou altura quando eles estiverem preenchidos.

DADOS DO USUÁRIO:
Nome: ${profile?.nome || "não informado"}
Objetivo: ${profile?.objetivo || "não informado"}
Peso: ${profile?.peso || "não informado"} kg
Altura: ${profile?.altura || "não informado"} cm
Idade: ${profile?.idade || "não informado"} anos
Sexo: ${profile?.sexo || "não informado"}
Nível de treino: ${profile?.nivel || "não informado"}
Restrições/preferências: ${profile?.restricoes || "não informado"}

PEDIDO:
${message}

REGRAS:
- Se for dieta, monte com refeições, alimentos específicos e quantidades em gramas.
- Use o peso, altura, idade, sexo e objetivo para estimar calorias e macros.
- Seja prático, claro e em português do Brasil.
- Não diga que faltam dados se eles estiverem listados acima.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      input: prompt,
      max_output_tokens: 1400
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

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "troque-este-segredo-no-render";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getUsers() {
  try {
    return JSON.parse(process.env.USERS_JSON || "[]");
  } catch {
    return [];
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Acesso negado. Faça login." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
  }
}

const systemPrompt = `
Você é a IA oficial do FitSelf, um assistente fitness premium em português do Brasil.

Função:
- Ajudar com dieta, treino, substituições alimentares, evolução corporal e organização da rotina.
- Quando montar dieta, usar alimentos reais, quantidades aproximadas em gramas e refeições organizadas.
- Quando montar treino, informar exercícios, séries, repetições, descanso e cuidados.
- Considerar sempre: nome, peso, altura, idade, sexo, objetivo, nível e restrições.

Regras:
- Não diga que faltam dados se eles estiverem informados.
- Não prometa resultado garantido.
- Não prescreva medicamentos, hormônios, anabolizantes ou tratamento médico.
- Em sintomas graves, doença, dor forte, gestação, transtorno alimentar ou uso de medicamentos, oriente procurar profissional de saúde.
`;

app.get("/", (req, res) => {
  res.json({ ok: true, app: "FitSelf IA PRO Login Real", status: "online" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Informe e-mail e senha." });
    }

    const users = getUsers();
    const user = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());

    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({ token, user: { email: user.email } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao fazer login." });
  }
});

app.post("/api/chat", authMiddleware, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada." });
    }

    const { message, profile } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Mensagem inválida." });
    }

    const userContext = `
Usuário logado: ${req.user?.email || "não informado"}

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
`;

    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContext }
      ],
      max_output_tokens: 1400
    });

    return res.json({ answer: response.output_text || "Não consegui gerar resposta agora." });
  } catch (error) {
    console.error("Erro OpenAI:", error);
    return res.status(500).json({
      error: "Erro ao chamar a IA. Tente novamente em instantes."
    });
  }
});

app.listen(port, () => {
  console.log(`FitSelf IA PRO rodando na porta ${port}`);
});

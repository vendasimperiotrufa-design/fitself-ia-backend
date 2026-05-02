# Backend FitSelf IA pronto para Render

## Arquivos importantes

- `server.js`: servidor Node/Express
- `package.json`: dependências
- `render.yaml`: configuração para o Render

## Variável obrigatória no Render

Crie esta variável em Environment:

OPENAI_API_KEY = sua chave da OpenAI

Opcional:

OPENAI_MODEL = gpt-5.4-mini

## Teste

Depois do deploy, abra a URL do Render. Deve aparecer JSON com status online.

A rota do chat será:

https://SEU-LINK-DO-RENDER.onrender.com/api/chat

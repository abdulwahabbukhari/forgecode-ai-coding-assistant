import { Router, type IRouter } from "express";
import { SendChatMessageBody, SendChatMessageResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_URL =
  process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";

const systemPrompt = [
  "You are ForgeCode, a senior AI coding assistant.",
  "Help users write, explain, debug, review, and improve software.",
  "Return complete working code when the user asks for an implementation.",
  "Use Markdown headings and fenced code blocks with a language label.",
  "Prefer direct, practical explanations and mention important assumptions.",
  "Never claim to have run code or accessed files you were not given.",
].join(" ");

function demoReply(lastMessage: string, code: string | null, language: string | null) {
  const subject = lastMessage.length > 96
    ? `${lastMessage.slice(0, 93)}...`
    : lastMessage;
  const codeHint = code
    ? `\n\nI also received your ${language ?? "code"} context (${code.split("\n").length} lines).`
    : "";

  return [
    "## Ready to help",
    "",
    `I received: “${subject}”${codeHint}`,
    "",
    "This preview is running without an API key. Add your key in the server environment or in the InfinityFree `config.php` file to enable live AI responses.",
    "",
    "When connected, I will return complete implementations in copy-ready fenced code blocks, explain the important decisions, and call out any assumptions.",
    "",
    "```js",
    "function greetDeveloper(name) {",
    "  return `Hello, ${name}. Your workspace is ready.`;",
    "}",
    "",
    "console.log(greetDeveloper('developer'));",
    "```",
  ].join("\n");
}

router.post("/chat", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid message and optional code context." });
    return;
  }

  const { messages, code, language } = parsed.data;
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    const response = SendChatMessageResponse.parse({
      message: demoReply(messages[messages.length - 1].content, code ?? null, language ?? null),
      model: "preview",
      demo: true,
    });
    res.json(response);
    return;
  }

  const context = code
    ? `\n\nCode context (${language ?? "text"}):\n\`\`\`${language ?? ""}\n${code}\n\`\`\``
    : "";

  try {
    const upstream = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((message) => ({
            role: message.role,
            content: message === messages[messages.length - 1]
              ? `${message.content}${context}`
              : message.content,
          })),
        ],
      }),
    });

    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!upstream.ok) {
      logger.warn({ status: upstream.status, error: payload.error?.message }, "AI provider request failed");
      res.status(502).json({ error: payload.error?.message ?? "The AI provider could not complete the request." });
      return;
    }

    const message = payload.choices?.[0]?.message?.content?.trim();
    if (!message) {
      res.status(502).json({ error: "The AI provider returned an empty response." });
      return;
    }

    res.json(SendChatMessageResponse.parse({
      message,
      model: DEFAULT_MODEL,
      demo: false,
    }));
  } catch (error) {
    logger.error({ err: error }, "AI provider request errored");
    res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again." });
  }
});

export default router;
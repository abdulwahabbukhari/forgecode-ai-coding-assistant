import { Router, type IRouter } from "express";
import { SendChatMessageBody, SendChatMessageResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_URL =
  process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";
const IMAGE_URL =
  process.env.OPENAI_IMAGE_API_URL ?? "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

const systemPrompt = [
  "You are WAHAB AI Version 2, a senior software engineer and practical coding expert.",
  "Your owner and developer is Syed Abdul Wahab Bukhari.",
  'If the user asks "Tumhara naam kya hai?", reply exactly: "Mera naam WAHAB AI hai."',
  'If the user asks "Tumhein kis ne banaya hai?", reply exactly: "Mujhe Syed Abdul Wahab Bukhari ne banaya hai."',
  "Answer these identity questions clearly in Roman Urdu.",
  "Help users write, explain, debug, fix, review, secure and improve software.",
  "When asked to implement something, return complete working code with file paths and clear setup steps.",
  "Use Markdown headings and fenced code blocks with a language label.",
  "Respect supplied project context and never invent files, test results, deployments or access you do not have.",
  "For web work, prefer accessible, responsive and maintainable HTML, CSS and JavaScript.",
  "Be direct and identify important assumptions, risks and exact changes.",
].join(" ");

type ProviderContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: ProviderContent;
};

function cleanText(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function identityAnswer(message: string): string | null {
  const normalized = message
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "tumhara naam kya hai") return "Mera naam WAHAB AI hai.";
  if (
    ["tumhein kis ne banaya hai", "tumhen kis ne banaya hai", "tumhe kis ne banaya hai"].includes(
      normalized,
    )
  ) {
    return "Mujhe Syed Abdul Wahab Bukhari ne banaya hai.";
  }
  return null;
}

function providerMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "The provider returned an invalid response.";
  const error = (payload as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string"
    ? error.message
    : "The AI provider could not complete the request.";
}

async function callProvider(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as unknown;
  return { response, payload };
}

function buildContext(
  code: string | null | undefined,
  language: string | null | undefined,
  pdfText: string | null | undefined,
  projectFiles: Array<{ path: string; content: string }> | undefined,
) {
  const sections: string[] = [];
  if (code) {
    sections.push(
      `Selected code context (${language ?? "text"}):\n\`\`\`${language ?? ""}\n${code}\n\`\`\``,
    );
  }
  if (pdfText) sections.push(`Extracted PDF text:\n${pdfText.slice(0, 60000)}`);
  if (projectFiles?.length) {
    const files: string[] = [];
    let total = 0;
    for (const file of projectFiles.slice(0, 80)) {
      const content = file.content.slice(0, 18000);
      total += content.length;
      if (!file.path || !content || total > 100000) break;
      files.push(`FILE: ${file.path}\n\`\`\`\n${content}\n\`\`\``);
    }
    if (files.length) sections.push(`Project files supplied by the user:\n${files.join("\n\n")}`);
  }
  return sections.length ? `\n\n${sections.join("\n\n")}` : "";
}

function imageParts(attachments: Array<{ name: string; type: string; data: string }> | undefined) {
  return (attachments ?? [])
    .slice(0, 3)
    .filter((item) => item.type.startsWith("image/") && item.data.startsWith("data:image/"))
    .map((item) => ({
      type: "image_url" as const,
      image_url: { url: item.data.slice(0, 8_000_000) },
    }));
}

async function generateImage(
  prompt: string,
  apiKey: string,
  size: string,
): Promise<{ error: string; status: number } | { imageUrl: string; model: string }> {
  const { response, payload } = await callProvider(IMAGE_URL, apiKey, {
    model: IMAGE_MODEL,
    prompt,
    size: ["1024x1024", "1536x1024", "1024x1536"].includes(size) ? size : "1024x1024",
  });
  if (!response.ok) return { error: providerMessage(payload), status: 502 };
  const data = (payload as { data?: Array<{ url?: string; b64_json?: string }> }).data?.[0];
  const imageUrl = data?.url ?? (data?.b64_json ? `data:image/png;base64,${data.b64_json}` : "");
  if (!imageUrl) return { error: "The image provider returned no downloadable image.", status: 502 };
  return { imageUrl, model: IMAGE_MODEL };
}

router.post("/chat", async (req, res) => {
  const rawBody = req.body as Record<string, unknown>;

  if (rawBody.mode === "image") {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error: "WAHAB AI is not configured. Add OPENAI_API_KEY to the API server environment.",
      });
      return;
    }
    const prompt = cleanText(rawBody.prompt, 4000);
    if (!prompt) {
      res.status(400).json({ error: "Add an image description before generating." });
      return;
    }
    try {
      const result = await generateImage(prompt, apiKey, cleanText(rawBody.size, 30));
      if ("error" in result) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.json({ image_url: result.imageUrl, model: result.model });
    } catch (error) {
      logger.error({ err: error }, "Image provider request errored");
      res.status(502).json({ error: "The image provider is temporarily unavailable." });
    }
    return;
  }

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid message and optional project context." });
    return;
  }

  const { messages, code, language, pdfText, projectFiles, attachments } = parsed.data;
  const latestMessage = messages[messages.length - 1];
  if (latestMessage?.role === "user") {
    const answer = identityAnswer(latestMessage.content);
    if (answer) {
      res.json(SendChatMessageResponse.parse({
        message: answer,
        model: "identity",
        demo: false,
      }));
      return;
    }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({
      error: "WAHAB AI is not configured. Add OPENAI_API_KEY to the API server environment.",
    });
    return;
  }

  const context = buildContext(code, language, pdfText, projectFiles);
  const parts = imageParts(attachments);
  const providerMessages: ProviderMessage[] = messages.map((message, index) => ({
    role: message.role,
    content:
      index === messages.length - 1 && context
        ? parts.length
          ? [{ type: "text", text: `${message.content}${context}` }, ...parts]
          : `${message.content}${context}`
        : message.content,
  }));

  try {
    const { response, payload } = await callProvider(OPENAI_URL, apiKey, {
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: [{ role: "system", content: systemPrompt }, ...providerMessages],
    });

    if (!response.ok) {
      logger.warn({ status: response.status, error: providerMessage(payload) }, "AI provider request failed");
      res.status(502).json({ error: providerMessage(payload) });
      return;
    }

    let message = (payload as {
      choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    }).choices?.[0]?.message?.content;
    if (Array.isArray(message)) message = message.map((part) => part.text ?? "").join("\n");
    if (!message?.trim()) {
      res.status(502).json({ error: "The AI provider returned an empty response." });
      return;
    }

    res.json(SendChatMessageResponse.parse({
      message: message.trim(),
      model: DEFAULT_MODEL,
      demo: false,
    }));
  } catch (error) {
    logger.error({ err: error }, "AI provider request errored");
    res.status(502).json({ error: "The AI service is temporarily unavailable. Check the provider settings." });
  }
});

export default router;
import type { ChatCompletionMessageParam, ChatCompletionChunk } from "openai";

export interface StreamingCallbacks {
  onToken?: (token: string) => void;
  onFinish?: (fullText: string) => void;
  onError?: (error: unknown) => void;
}

export interface ChatStreamingConfig {
  model: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  client?: OpenAICompatibleClient;
}

export interface OpenAICompatibleClient {
  chat: {
    completions: {
      create: (params: ChatCompletionCreateParams) => Promise<AsyncIterable<ChatCompletionChunk>> | AsyncIterable<ChatCompletionChunk>;
    };
  };
}

export interface ChatCompletionCreateParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function streamChatCompletion(
  messages: ChatCompletionMessageParam[],
  config: ChatStreamingConfig,
  callbacks: StreamingCallbacks = {},
): Promise<string> {
  const { onToken, onFinish, onError } = callbacks;
  try {
    const client = await ensureClient(config);
    const stream = await client.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: true,
    });

    let fullText = "";

    for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
      const token = chunk.choices?.[0]?.delta?.content ?? "";
      if (token) {
        fullText += token;
        onToken?.(token);
      }
    }

    onFinish?.(fullText);
    return fullText;
  } catch (error) {
    onError?.(error);
    throw error;
  }
}

async function ensureClient(config: ChatStreamingConfig): Promise<OpenAICompatibleClient> {
  if (config.client) return config.client;

  const openAIModule: OpenAIModule = await import("openai");
  const OpenAIConstructor = (openAIModule.default ?? openAIModule) as OpenAIConstructor;
  return new OpenAIConstructor({
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
    baseURL: config.baseURL,
  });
}

type OpenAIModule = { default?: OpenAIConstructor } & Record<string, unknown>;
type OpenAIConstructor = new (options: Record<string, unknown>) => OpenAICompatibleClient;

declare module "openai" {
  export type Role = "system" | "user" | "assistant" | "tool" | "function" | string;

  export interface ChatCompletionMessageParam {
    role: Role;
    content: string;
  }

  export interface ChatCompletionChunkChoiceDelta {
    content?: string;
    role?: Role;
  }

  export interface ChatCompletionChunkChoice {
    delta: ChatCompletionChunkChoiceDelta;
  }

  export interface ChatCompletionChunk {
    choices: ChatCompletionChunkChoice[];
  }

  export interface ChatCompletionCreateParams {
    model: string;
    messages: ChatCompletionMessageParam[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }

  export default class OpenAI {
    constructor(options: { apiKey?: string; baseURL?: string });
    chat: {
      completions: {
        create: (
          params: ChatCompletionCreateParams,
        ) => Promise<AsyncIterable<ChatCompletionChunk>> | AsyncIterable<ChatCompletionChunk>;
      };
    };
  }
}

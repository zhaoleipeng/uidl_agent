import { describe, expect, it } from "vitest";
import type { ChatCompletionChunk, ChatCompletionMessageParam } from "openai";
import { streamChatCompletion } from "../src/agent";

class FakeStream implements AsyncIterable<ChatCompletionChunk> {
  async *[Symbol.asyncIterator](): AsyncIterator<ChatCompletionChunk> {
    yield { choices: [{ delta: { content: "Hello" } }] } as ChatCompletionChunk;
    yield { choices: [{ delta: { content: " world" } }] } as ChatCompletionChunk;
  }
}

class FakeClient {
  chat = {
    completions: {
      create: async () => new FakeStream(),
    },
  };
}

describe("streamChatCompletion", () => {
  it("streams tokens and resolves the full text", async () => {
    const tokens: string[] = [];
    let finished = "";
    const messages: ChatCompletionMessageParam[] = [{ role: "user", content: "hello" }];

    const result = await streamChatCompletion(
      messages,
      {
        model: "gpt-4o-mini",
        client: new FakeClient(),
      },
      {
        onToken: (token) => tokens.push(token),
        onFinish: (text) => {
          finished = text;
        },
      },
    );

    expect(tokens).toEqual(["Hello", " world"]);
    expect(result).toBe("Hello world");
    expect(finished).toBe("Hello world");
  });
});

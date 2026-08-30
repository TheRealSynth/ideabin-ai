import { describe, expect, it, vi } from "vitest";
import { OpenAiProvider } from "./openai";
import { ProviderCallError } from "./types";

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

const BASE_REQUEST = {
  systemPrompt: "system",
  userPrompt: "user",
  model: "gpt-4o-mini",
};

describe("OpenAiProvider", () => {
  it("throws missing_credentials without calling the network when no API key is configured", async () => {
    const fetchImpl = vi.fn();
    const provider = new OpenAiProvider({ apiKey: undefined, fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({
      kind: "missing_credentials",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns text and token usage on a successful call", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }],
        usage: { prompt_tokens: 42, completion_tokens: 7 },
      }),
    );
    const provider = new OpenAiProvider({ apiKey: "test-key", fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await provider.call(BASE_REQUEST);
    expect(result.text).toBe('{"ok":true}');
    expect(result.inputTokens).toBe(42);
    expect(result.outputTokens).toBe(7);

    // API key must reach the network only via the Authorization header of a
    // server-initiated fetch, never embedded in a client-reachable payload.
    const [, init] = fetchImpl.mock.calls[0];
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");
  });

  it("classifies a non-2xx response as provider_error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }));
    const provider = new OpenAiProvider({ apiKey: "test-key", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({ kind: "provider_error" });
  });

  it("classifies an unparsable JSON body as malformed_payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not json", { status: 200 }));
    const provider = new OpenAiProvider({ apiKey: "test-key", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({ kind: "malformed_payload" });
  });

  it("classifies a payload missing message content as malformed_payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ choices: [{ message: {} }] }));
    const provider = new OpenAiProvider({ apiKey: "test-key", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({ kind: "malformed_payload" });
  });

  it("classifies a content-filter finish reason as a refusal", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "" }, finish_reason: "content_filter" }] }),
    );
    const provider = new OpenAiProvider({ apiKey: "test-key", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({ kind: "refusal" });
  });

  it("classifies a network failure as network_error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    const provider = new OpenAiProvider({ apiKey: "test-key", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({ kind: "network_error" });
  });

  it("classifies an aborted/slow call as a timeout", async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    const provider = new OpenAiProvider({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 5,
    });

    await expect(provider.call(BASE_REQUEST)).rejects.toMatchObject({ kind: "timeout" });
  });

  it("re-exports ProviderCallError as the rejection type", async () => {
    const provider = new OpenAiProvider({ apiKey: undefined });
    try {
      await provider.call(BASE_REQUEST);
      expect.unreachable("expected call to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderCallError);
    }
  });
});

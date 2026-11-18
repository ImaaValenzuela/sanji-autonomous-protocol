import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { transferSolPayment } from "./solana-pay.js";

export interface X402PayParams {
  recipient: string;
  amountLamports: number;
  memo: string;
  skill?: string;
  network?: string;
}

export interface X402PayResult {
  signature: string;
  simulated: boolean;
  via: "mcp" | "solana" | "demo";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function extractSignature(payload: unknown): string | null {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    try {
      return extractSignature(JSON.parse(trimmed) as unknown);
    } catch {
      const match = trimmed.match(/[1-9A-HJ-NP-Za-km-z]{64,88}/);
      return match?.[0] ?? (trimmed.startsWith("demo_") ? trimmed : null);
    }
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractSignature(item);
      if (found) return found;
    }
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  for (const key of ["signature", "txSignature", "paymentSignature", "tx"]) {
    if (typeof record[key] === "string" && record[key]) return record[key];
  }
  if ("text" in record) return extractSignature(record.text);
  if ("content" in record) return extractSignature(record.content);
  return null;
}

export class SanjiMcpClient {
  private client: Client | null = null;
  private transport: SSEClientTransport | StreamableHTTPClientTransport | null = null;

  async connect(): Promise<string[]> {
    const url = process.env.CLAWPUMP_MCP_URL?.trim() || "https://mcp.clawpump.tech/mcp";
    const apiKey = process.env.CLAWPUMP_API_KEY?.trim() ?? "";
    const headers: Record<string, string> = {};
    if (apiKey && !apiKey.includes("replace_me")) {
      headers.authorization = `Bearer ${apiKey}`;
      headers["x-api-key"] = apiKey;
    }

    const endpoint = new URL(url);
    const attempts: Array<{ name: string; open: () => SSEClientTransport | StreamableHTTPClientTransport }> = [
      {
        name: "SSE",
        open: () => new SSEClientTransport(endpoint, { requestInit: { headers } }),
      },
      {
        name: "streamable HTTP",
        open: () => new StreamableHTTPClientTransport(endpoint, { requestInit: { headers } }),
      },
    ];

    let lastError = "MCP connection failed";
    for (const attempt of attempts) {
      await this.close();
      this.client = new Client({ name: "sanji-grokbot", version: "1.0.0" });
      this.transport = attempt.open();
      try {
        await withTimeout(
          this.client.connect(this.transport),
          8_000,
          `${attempt.name} connection timed out`,
        );
        return await this.listAgentTools();
      } catch (error) {
        lastError = error instanceof Error ? error.message : `${attempt.name} failed`;
        console.log(`\x1b[2m[MCP] ${attempt.name} unavailable (${lastError}).\x1b[0m`);
        await this.close();
      }
    }

    console.log(`\x1b[36m[MCP]\x1b[0m Standalone signer (${lastError}).`);
    return [];
  }

  async listAgentTools(): Promise<string[]> {
    if (!this.client) return [];
    const listed = await this.client.listTools();
    return listed.tools.map((tool) => tool.name);
  }

  async payWithX402(params: X402PayParams): Promise<X402PayResult> {
    if (this.client) {
      try {
        const result = await withTimeout(
          this.client.callTool({
            name: "x402_pay",
            arguments: {
              network: params.network ?? "solana-mainnet",
              recipient: params.recipient,
              amountLamports: params.amountLamports,
              memo: params.memo,
              skill: params.skill ?? "sanji_global_lead_enricher",
            },
          }),
          20_000,
          "x402_pay timed out",
        );
        const signature = extractSignature(result);
        if (signature) return { signature, simulated: signature.startsWith("demo_"), via: "mcp" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "x402_pay failed";
        console.log(`\x1b[35m[x402]\x1b[0m MCP tool unavailable (${message}). Signing a native transfer.`);
      }
    }

    try {
      const paid = await transferSolPayment({
        recipient: params.recipient,
        lamports: params.amountLamports,
        memo: params.memo,
      });
      return {
        signature: paid.signature,
        simulated: paid.simulated,
        via: paid.simulated ? "demo" : "solana",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "native transfer failed";
      console.log(`\x1b[32m[SOLANA]\x1b[0m Native transfer skipped (${message}).`);
      return { signature: `demo_${Date.now()}`, simulated: true, via: "demo" };
    }
  }

  async close(): Promise<void> {
    try {
      await this.client?.close();
    } catch {
      // The SSE session may already be gone after a timeout.
    }
    try {
      await this.transport?.close();
    } catch {
      // Ignore a transport that never opened.
    }
    this.client = null;
    this.transport = null;
  }
}

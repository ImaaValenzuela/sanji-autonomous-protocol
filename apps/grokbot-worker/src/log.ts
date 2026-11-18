function line(color: string, tag: string, message: string): void {
  console.log(`\x1b[${color}m[${tag}]\x1b[0m ${message}`);
}

export const log = {
  mcp: (message: string) => line("36", "MCP", message),
  scout: (message: string) => line("33", "SCOUT", message),
  x402: (message: string) => line("35", "x402", message),
  solana: (message: string) => line("32", "SOLANA", message),
  preview: (message: string) => line("34", "PREVIEW", message),
  grok: (message: string) => line("91", "GROKBOT", message),
  detail: (message: string) => console.log(`\x1b[2m${message}\x1b[0m`),
};

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { isPlaceholder, readEnv, X402_LAMPORTS } from "./env.js";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export function rpcUrl(): string {
  return readEnv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com");
}

export function solanaConnection(): Connection {
  return new Connection(rpcUrl(), "confirmed");
}

export function loadAgentKeypair(): Keypair | null {
  const raw = readEnv("SANJI_AGENT_PRIVATE_KEY");
  if (isPlaceholder(raw)) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
}

export function treasuryAddress(): string {
  return readEnv("SANJI_TREASURY_PUBLIC_KEY", "SANJI_TREASURY_PUBLIC_KEY");
}

export function treasuryPublicKey(): PublicKey | null {
  const raw = readEnv("SANJI_TREASURY_PUBLIC_KEY");
  if (isPlaceholder(raw)) return null;
  try {
    return new PublicKey(raw);
  } catch {
    return null;
  }
}

interface ParsedTransfer {
  program?: string;
  parsed?: {
    type?: string;
    info?: {
      destination?: string;
      lamports?: number | string;
    };
  };
}

function asTransfer(instruction: unknown): ParsedTransfer | null {
  if (!instruction || typeof instruction !== "object" || !("parsed" in instruction)) return null;
  return instruction as ParsedTransfer;
}

export async function verifyTreasuryPayment(
  signature: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const treasury = treasuryPublicKey();
  if (!treasury) {
    return {
      ok: false,
      reason: "SANJI_TREASURY_PUBLIC_KEY is not configured for on-chain verification.",
    };
  }

  let tx;
  try {
    tx = await solanaConnection().getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Solana RPC request failed.";
    return { ok: false, reason: message };
  }

  if (!tx) return { ok: false, reason: "Transaction not found on Solana." };
  if (tx.meta?.err) return { ok: false, reason: "Transaction failed on-chain." };

  const destination = treasury.toBase58();
  const instructions: unknown[] = [...tx.transaction.message.instructions];
  for (const inner of tx.meta?.innerInstructions ?? []) {
    instructions.push(...inner.instructions);
  }

  let received = 0;
  for (const instruction of instructions) {
    const parsed = asTransfer(instruction);
    if (!parsed || parsed.program !== "system" || parsed.parsed?.type !== "transfer") continue;
    if (parsed.parsed.info?.destination !== destination) continue;
    received += Number(parsed.parsed.info.lamports ?? 0);
  }

  if (received < X402_LAMPORTS) {
    return {
      ok: false,
      reason: `Treasury received ${received} lamports; ${X402_LAMPORTS} required.`,
    };
  }
  return { ok: true };
}

export async function signAndBroadcastVersioned(base64Transaction: string): Promise<string> {
  const keypair = loadAgentKeypair();
  if (!keypair) {
    throw new Error("SANJI_AGENT_PRIVATE_KEY is not a usable base58 secret.");
  }
  const transaction = VersionedTransaction.deserialize(Buffer.from(base64Transaction, "base64"));
  transaction.sign([keypair]);
  const connection = solanaConnection();
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  const latest = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed",
  );
  return signature;
}

export async function transferSolPayment(input: {
  recipient: string;
  lamports: number;
  memo: string;
}): Promise<{ signature: string; simulated: boolean }> {
  const payer = loadAgentKeypair();
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(input.recipient);
  } catch {
    return { signature: `demo_${Date.now()}`, simulated: true };
  }
  if (!payer) return { signature: `demo_${Date.now()}`, simulated: true };

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient,
      lamports: input.lamports,
    }),
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from(input.memo, "utf8"),
    }),
  );

  const signature = await solanaConnection().sendTransaction(transaction, [payer], {
    skipPreflight: false,
    maxRetries: 3,
  });
  return { signature, simulated: false };
}

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function placeholder(value: string | undefined): boolean {
  if (!value || !value.trim()) return true;
  return (
    value.includes("base58_solana_private_key_here") ||
    value.includes("solana_public_key_here") ||
    value.includes("replace_me")
  );
}

export function loadAgentKeypair(): Keypair | null {
  const raw = process.env.SANJI_AGENT_PRIVATE_KEY?.trim();
  if (placeholder(raw)) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw as string));
  } catch {
    return null;
  }
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

  const connection = new Connection(
    process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com",
    "confirmed",
  );
  const signature = await connection.sendTransaction(transaction, [payer], {
    skipPreflight: false,
    maxRetries: 3,
  });
  return { signature, simulated: false };
}

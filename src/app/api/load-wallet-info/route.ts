import base58 from "bs58";
import dotenv from "dotenv";
import { Connection, Keypair } from "@solana/web3.js";

dotenv.config();

export async function POST(request: Request) {
  const params = await request.json();
  const connection = new Connection(process.env.HTTPS_SERVER ?? 'https://api.mainnet-beta.solana.com');
  const keypair = Keypair.fromSecretKey(base58.decode(params.key));
  const solBalance = await connection.getBalance(keypair.publicKey);
  return Response.json({solBalance, publicKey: keypair.publicKey.toBase58()});
}
import base58 from "bs58";
import { Connection, Keypair } from "@solana/web3.js";

export async function POST(request: Request) {
  const params = await request.json();
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const keypair = Keypair.fromSecretKey(base58.decode(params.key));
  const solBalance = await connection.getBalance(keypair.publicKey);
  return Response.json({solBalance});
}
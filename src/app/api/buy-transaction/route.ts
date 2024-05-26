import dotenv from 'dotenv';
import { JitoTransaction } from "@/blockchain/utils/jitoTransaction";
import { TransactionRequest } from "@/blockchain/@types/TokenInfo";
import { BuyRequest } from "@/@types";

dotenv.config();

export async function POST(request: Request) {
  const params = await request.json();
  if (!process.env.JITO_BACKEND_URI) {
    return Response.json({error: "You should provide the jito backend uri."});
  }
  if (!process.env.JITO_BACKEND_APIKEY) {
    return Response.json({error: "You should provide the jito backend api key."});
  }
  const jitoTransaction = new JitoTransaction(
    process.env.HTTPS_SERVER ?? "https://api.mainnet-beta.solana.com",
    process.env.JITO_BACKEND_URI,
    process.env.JITO_BACKEND_APIKEY
  );

  const actionRequests: Array<TransactionRequest> = params.data.map((item: BuyRequest) => ({
    walletSecretKey: item.walletKey,
    mintAddress: item.mintAddress,
    amount: item.buyAmount,
    slippage: item.slippage,
    jitoTip: item.jitoTip
  }));

  const jitoTx = await jitoTransaction.buyWithJito(actionRequests);
  return Response.json({jitoTx});
}
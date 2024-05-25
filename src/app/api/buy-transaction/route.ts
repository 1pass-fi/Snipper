import dotenv from 'dotenv';
import { JitoTransaction } from "@/blockchain/utils/jitoTransaction";
import { TransactionRequest } from "@/blockchain/@types/TokenInfo";
import { BuyRequest } from "@/@types";

dotenv.config();

export async function POST(request: Request) {
  const params = await request.json();
  const jitoTransaction = new JitoTransaction(process.env.HTTPS_SERVER ?? 'https://api.mainnet-beta.solana.com');

  const actionRequests: Array<TransactionRequest> = params.data.map((item: BuyRequest) => ({
    walletSecretKey: item.walletKey,
    mintAddress: item.mintAddress,
    amount: item.buyAmount * Math.pow(10, 9),
    slippage: item.slippage
  }));

  console.log(actionRequests);

  const jitoTx = await jitoTransaction.buyWithJito(actionRequests, params.data[0].jitoTip * Math.pow(10, 9));
  return Response.json({jitoTx});
}
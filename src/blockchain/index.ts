import base58 from "bs58";
import { config } from 'dotenv';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { TransactionRequest } from "./@types/TokenInfo.js";
import { TOKEN_MINT_ADDRESS } from './constants/constants.js';
import { PumpTransaction } from './utils/pumpTransaction.js';
import { loadWalletInfo, loadWallets } from './utils/utils.js';
import { subscribe } from "./utils/tokenSubscribe.js";
import { JitoTransaction } from "./utils/jitoTransaction.js";

config();

const main = async() => {

  const jitoTransaction = new JitoTransaction('https://api.mainnet-beta.solana.com');
  const tokens = await loadWallets('pumpVolumeMakerExample.csv');
  const actionRequests: Array<TransactionRequest> = tokens.map(token => ({
    walletSecretKey: token.PRIVATE_KEY,
    mintAddress: TOKEN_MINT_ADDRESS,
    amount: 14000,
    slippage: 10
  }));
  
  const jitoTx = await jitoTransaction.sellWithJito(actionRequests, tokens[0].jitoTip * Math.pow(10, 9));
  console.log(jitoTx);
}

main();
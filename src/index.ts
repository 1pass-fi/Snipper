import base58 from "bs58";
import { config } from 'dotenv';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { TOKEN_MINT_ADDRESS } from './constants/constants.js';
import { buyTransaction, sellTransaction } from './utils/swapTransactions';
import { loadWalletInfo } from './utils/utils.js';

config();

const main = async() => {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const metaplex = Metaplex.make(connection);
  const secretKey = base58.decode(process.env.PRIVATE_KEY ?? '');
  const owner = Keypair.fromSecretKey(secretKey);
  // await buyTransaction(process.env.PRIVATE_KEY, TOKEN_MINT_ADDRESS);
  // await sellTransaction(process.env.PRIVATE_KEY, TOKEN_MINT_ADDRESS);
  const tokenInfos = await loadWalletInfo(connection, metaplex, owner.publicKey);
  console.log(tokenInfos);
}

main();
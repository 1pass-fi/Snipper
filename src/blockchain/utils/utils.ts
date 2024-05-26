import fs from 'fs';
import base58 from "bs58";
import readLine from 'readline';
import { Metaplex } from '@metaplex-foundation/js';
import { Wallet } from '@coral-xyz/anchor/dist/cjs/index';
import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenInfo } from '../@types/TokenInfo';

/**
 * Get parsed and wallet info from secret key
 * @param walletSecretKey 
 * @returns Object
 */
const getParseWalletInfoFromSecretKey = (walletSecretKey: string) => {
  const secretKey = base58.decode(walletSecretKey);
  const owner = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(Keypair.fromSecretKey(secretKey));
  return {
    ownerKeypair: owner,
    wallet
  };
}

/**
 * Check if the associated token account exists
 * @param {*} connection : Connection
 * @param {*} walletPublicKey : PublicKey
 * @param {*} tokenMintAddress : PublicKey
 * @returns Boolean
 */
const checkAssociatedTokenAcount = async (connection: Connection, walletPublicKey: PublicKey, tokenMintAddress: PublicKey) => {
  try {
    // Get the associated token address for your wallet and token mint
    const associatedTokenAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMintAddress,
      walletPublicKey
    );

    // Get account info
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);

    if (accountInfo) {
      return associatedTokenAddress.toBase58();
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error checking associated token account:', error);
  }
};

/**
 * Create Associated Token Account
 * @param {*} connection : Connection
 * @param {*} owner : Keypair
 * @returns {*} address : String
 */
const createAssociatedTokenAccount = async (connection: Connection, owner: Keypair, mintPublicKey: PublicKey) => {
  // Get the associated token account address for the wallet
  const associatedTokenAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintPublicKey,
    owner.publicKey
  );
  // Check if the associated token account already exists
  const associatedTokenAccountInfo = await connection.getAccountInfo(associatedTokenAddress);
  const mint = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID, owner );
  
  if (!associatedTokenAccountInfo) {
    // Create the associated token account if it doesn't exist
    console.log(`Associated token created from token (${mintPublicKey})`);
    return Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      associatedTokenAddress,
      owner.publicKey,
      owner.publicKey
    );
  } 
  return false;
};

/**
 * find associated Token Address
 * @param {*} walletAddress : PublicKey
 * @param {*} tokenMintAddress : PublicKey
 * @returns 
 */
const findAssociatedTokenAddress = (walletAddress: PublicKey, tokenMintAddress: PublicKey) => {
  const [result] = PublicKey.findProgramAddressSync([
    walletAddress.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    tokenMintAddress.toBuffer()
  ], ASSOCIATED_TOKEN_PROGRAM_ID);
  return result;
};

/**
 * Get Details from Token Mint with heroku api
 * @param tokenMintAddress 
 * @returns bondingCurve
 * @returns associatedBondingCurve
 */
const getDetailsFromTokenMint = async (tokenMintAddress: string) => {
  const response = await fetch(`https://client-api-2-74b1891ee9f9.herokuapp.com/coins/${tokenMintAddress}`);
  const details = await response.json();

  return {
    bondingCurve: details.bonding_curve,
    associatedBondingCurve: details.associated_bonding_curve
  };
};

/**
 * Load multiple wallets from csv file
 * @param filePath string
 * @returns walletConfigs 
 */
const loadWallets = async (filePath: string) => {
  const fileStream = fs.createReadStream(filePath);

  const rl = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers: Array<string> = [];
  const walletConfigs = [];
  for await (const lines of rl) {
    const line = lines.split(',');
    if (!headers.length) {
      headers = line;
    } else {
      const wallet: any = {};
      for (let i = 0; i < headers.length; i ++) {
        wallet[headers[i]] = line[i];
      }
      walletConfigs.push(wallet);
    }
  }

  return walletConfigs;
};

/**
 * Load wallet info from Network
 * @param connection : Connection
 * @param walletPrivateKey PublicKey
 */
const loadWalletInfo = async (connection: Connection, metaplex: Metaplex, walletPrivateKey: PublicKey): Promise<Array<TokenInfo>> => {
  const solBalance = await connection.getBalance(walletPrivateKey);
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPrivateKey, {
    programId: TOKEN_PROGRAM_ID
  });

  const solInfo: TokenInfo = {
    mint: 'So11111111111111111111111111111111111111112',
    owner: walletPrivateKey.toBase58(),
    name: 'Wrapped SOL',
    symbol: 'SOL',
    uri: '',
    amount: solBalance,
    decimals: 9,
    uiAmount: solBalance / (Math.pow(10, 9)),
    uiAmountString: String(solBalance / (Math.pow(10, 9))),
  }

  const splTokens: Array<TokenInfo> = await Promise.all(tokenAccounts.value.map(async ({account}) => {
    const data = account.data.parsed.info;
    const tokenData = {
      mint: data.mint,
      owner: data.owner,
      name: 'unkown name',
      symbol: '',
      uri: '',
      amount: data.tokenAmount.amount,
      decimals: data.tokenAmount.decimals,
      uiAmount: data.tokenAmount.uiAmount,
      uiAmountString: data.tokenAmount.uiAmountString,
    };
    const mintAddress = new PublicKey(data.mint);

    const metadataAccount = metaplex.nfts().pdas().metadata({mint: mintAddress});
    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

    if (metadataAccountInfo) {
      const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
      tokenData.name = token.name;
      tokenData.symbol = token.symbol;
      tokenData.uri = token.uri;
    }

    return tokenData;
  }));

  return splTokens.concat([solInfo]).filter((info) => info.amount);
};

/**
 * Load wallet infos from private keys array
 * @param connection : Connection
 * @param metaplex : Metaplex
 * @param privateKeys : PublicKey
 * @returns Object
 */
const loadWalletFromPrivateKeys = async (connection: Connection, metaplex: Metaplex, privateKeys: Array<string>) => {
  const result: any = {};
  for (const key of privateKeys) {
    const secretKey = base58.decode(key);
    const owner = Keypair.fromSecretKey(secretKey);
    const tokenInfos = await loadWalletInfo(connection, metaplex, owner.publicKey);
    result[key] = tokenInfos;
  }

  return result;
};

export {
  getParseWalletInfoFromSecretKey,
  createAssociatedTokenAccount,
  findAssociatedTokenAddress,
  checkAssociatedTokenAcount,
  getDetailsFromTokenMint,
  loadWallets,
  loadWalletInfo,
  loadWalletFromPrivateKeys
};

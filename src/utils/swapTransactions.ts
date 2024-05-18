import { Program, AnchorProvider, setProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import base58 from "bs58";
import { createAssociatedTokenAccount, findAssociatedTokenAddress, getDetailsFromTokenMint } from './utils';
import { BN } from 'bn.js';
import idl from '../constants/idl';
import { PUMP_FUN_PROGRAM_ID } from '../constants/constants';

const exchangeRate = (purchaseAmount: number, liquidityPool: any) => {
  let tokensSold;
  const totalLiquidity = liquidityPool.virtualSolReserves.mul(liquidityPool.virtualTokenReserves);
  const newSolReserve = liquidityPool.virtualSolReserves.add(new BN(purchaseAmount));
  const pricePerToken = totalLiquidity.div(newSolReserve).add(new BN(1));

  tokensSold = liquidityPool.virtualTokenReserves.sub(pricePerToken);
  tokensSold = BN.min(tokensSold, liquidityPool.realTokenReserves);
  return tokensSold;
};

const buyTransaction = async (walletSecretKey: string, mintAddress: string, amount: number, slippage: number) => {
  const programId = new PublicKey(PUMP_FUN_PROGRAM_ID);
  const secretKey = base58.decode(walletSecretKey);
  const owner = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(Keypair.fromSecretKey(secretKey));
  const mint = new PublicKey(mintAddress);

  const {bondingCurve, associatedBondingCurve} = await getDetailsFromTokenMint(mintAddress);

  const r = findAssociatedTokenAddress(wallet.publicKey, mint);

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  setProvider(provider);

  const program = new Program(idl, programId, provider);

  const liquidityPool = await program.account.bondingCurve.fetch(bondingCurve);
  const tokenReceivedWithLiquidity = exchangeRate(Math.floor(1e9 * amount), liquidityPool);
  const solAmount = new BN(Math.floor(1e9 * amount));
  const maxSolAmount =  solAmount.mul(new BN(100 + slippage)).div(new BN(100));
  const associatedAddress = await createAssociatedTokenAccount(connection, owner, mint);
  console.log(`Associated Address: ${associatedAddress}`);

  const instruction = await program.methods.buy(tokenReceivedWithLiquidity, maxSolAmount).accounts({
    global: new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"),
    feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
    mint: mint,
    bondingCurve: new PublicKey(bondingCurve),
    associatedBondingCurve: new PublicKey(associatedBondingCurve),
    associatedUser: r,
    user: owner.publicKey,
    systemProgram: new PublicKey("11111111111111111111111111111111"),
    tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
    eventAuthority: PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], programId)[0],
    program: programId
  }).instruction();

  const instructions = [];
  instructions.push(instruction);
  const blockhash = await connection.getLatestBlockhash("finalized");
  const final_tx = new VersionedTransaction(new TransactionMessage({
    payerKey: owner.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: instructions
  }).compileToV0Message());

  final_tx.sign([wallet.payer]);

  const txid = await connection.sendTransaction(final_tx, {
    skipPreflight: true,
  });

  await connection.confirmTransaction(txid);

  console.log(txid);
};

const sellQuote = (sellAmount: number, liquidityPool: any) => {
  return new BN(sellAmount).mul(liquidityPool.virtualSolReserves).div(new BN(liquidityPool.virtualTokenReserves));
}

const sellTransaction = async (walletSecretKey: string, mintAddress: string, amount: number, slippage: number) => {
  const programId = new PublicKey(PUMP_FUN_PROGRAM_ID);
  const secretKey = base58.decode(walletSecretKey);
  const owner = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(Keypair.fromSecretKey(secretKey));
  const mint = new PublicKey(mintAddress);

  const {bondingCurve, associatedBondingCurve} = await getDetailsFromTokenMint(mintAddress);

  const r = findAssociatedTokenAddress(wallet.publicKey, mint);

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  setProvider(provider);

  const program = new Program(idl, programId, provider);
  const liquidityPool = await program.account.bondingCurve.fetch(bondingCurve);
  const tokenSellAmount = Math.floor(amount * 1e6); // change
  const solAmount = sellQuote(tokenSellAmount, liquidityPool);
  const minSolAmount = solAmount.mul(new BN(100 - slippage)).div(new BN(100));
  
  const associatedAddress = await createAssociatedTokenAccount(connection, owner, mint);
  console.log(`Associated Address: ${associatedAddress}`);

  const instruction = await program.methods.sell(new BN(tokenSellAmount), minSolAmount).accounts({
    global: new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"),
    feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
    mint: mint,
    bondingCurve: new PublicKey(bondingCurve),
    associatedBondingCurve: new PublicKey(associatedBondingCurve),
    associatedUser: r,
    user: owner.publicKey,
    systemProgram: new PublicKey("11111111111111111111111111111111"),
    tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
    eventAuthority: PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], programId)[0],
    program: programId
  }).instruction();

  const instructions = [];
  instructions.push(instruction);
  const blockhash = await connection.getLatestBlockhash("finalized");
  const final_tx = new VersionedTransaction(new TransactionMessage({
    payerKey: owner.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: instructions
  }).compileToV0Message());

  final_tx.sign([wallet.payer]);

  const txid = await connection.sendTransaction(final_tx, {
    skipPreflight: true,
  });

  await connection.confirmTransaction(txid);

  console.log(txid);
};

export {
  buyTransaction,
  sellTransaction
}
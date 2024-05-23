import base58 from "bs58";
import { BN } from 'bn.js';
import { Program, AnchorProvider, setProvider, Wallet } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { 
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js';
import idl from '../constants/idl';
import { TransactionRequest } from "../@types/TokenInfo";
import { PUMP_FUN_PROGRAM_ID } from '../constants/constants';
import { 
  createAssociatedTokenAccount,
  findAssociatedTokenAddress,
  getDetailsFromTokenMint,
  getParseWalletInfoFromSecretKey
} from './utils';

export class PumpTransaction {
  connection: Connection;
  programId: PublicKey;

  constructor(endPointUri: string) {
    this.connection = new Connection(endPointUri);
    this.programId = new PublicKey(PUMP_FUN_PROGRAM_ID);
  }

  /**
   * Calculate buy amount
   * @param program 
   * @param bondingCurve 
   * @param amount 
   * @param slippage 
   * @returns Object
   */
  async calculateBuyAmounts(program: Program, bondingCurve: PublicKey, amount: number, slippage: number) {
    const liquidityPool = await program.account.bondingCurve.fetch(bondingCurve);
    const tokenReceivedWithLiquidity = exchangeRate(Math.floor(1e9 * amount), liquidityPool);
    const solAmount = new BN(Math.floor(1e9 * amount));
    const maxSolAmount =  solAmount.mul(new BN(100 + slippage)).div(new BN(100));

    return {
      tokenReceivedWithLiquidity,
      maxSolAmount
    };
  }

  /**
   * Make Buy Instruction
   * @param wallet 
   * @param mint 
   * @param bondingCurve 
   * @param associatedBondingCurve 
   * @param associatedTokenPDA 
   * @param amount 
   * @param slippage 
   * @returns Instruction
   */
  async makeBuyInstruction (
    wallet: Wallet,
    mint: PublicKey,
    bondingCurve: PublicKey,
    associatedBondingCurve: PublicKey,
    associatedTokenPDA: PublicKey,
    amount: number,
    slippage: number
  ) {
    const provider = new AnchorProvider(this.connection, wallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(idl, this.programId, provider);
    const {tokenReceivedWithLiquidity, maxSolAmount} = await this.calculateBuyAmounts(program, bondingCurve, amount, slippage);

    const instruction = await program.methods.buy(tokenReceivedWithLiquidity, maxSolAmount).accounts({
      global: new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"),
      feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
      mint: mint,
      bondingCurve: new PublicKey(bondingCurve),
      associatedBondingCurve: new PublicKey(associatedBondingCurve),
      associatedUser: associatedTokenPDA,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
      eventAuthority: PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], this.programId)[0],
      program: this.programId
    }).instruction();

    return instruction;
  }

  /**
   * Make sell instruction
   * @param wallet 
   * @param mint 
   * @param bondingCurve 
   * @param associatedBondingCurve 
   * @param associatedTokenPDA 
   * @param amount 
   * @param slippage 
   * @returns Instruction
   */
  async makeSellInstruction (
    wallet: Wallet,
    mint: PublicKey,
    bondingCurve: PublicKey,
    associatedBondingCurve: PublicKey,
    associatedTokenPDA: PublicKey,
    amount: number,
    slippage: number
  ) {
    const provider = new AnchorProvider(this.connection, wallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(idl, this.programId, provider);
  
    const liquidityPool = await program.account.bondingCurve.fetch(bondingCurve);
    const tokenSellAmount = Math.floor(amount * 1e6); // change
    const solAmount = sellQuote(tokenSellAmount, liquidityPool);
    const minSolAmount = solAmount.mul(new BN(100 - slippage)).div(new BN(100));

    const instruction = await program.methods.sell(new BN(tokenSellAmount), minSolAmount).accounts({
      global: new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"),
      feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
      mint: mint,
      bondingCurve: new PublicKey(bondingCurve),
      associatedBondingCurve: new PublicKey(associatedBondingCurve),
      associatedUser: associatedTokenPDA,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
      eventAuthority: PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], this.programId)[0],
      program: this.programId
    }).instruction();

    return instruction;
  }

  /**
   * Make Trnasaction
   * @param instructions 
   * @param feePayer 
   * @returns Transaction Id
   */
  async makeTransaction (instructions: Array<TransactionInstruction>, feePayer: Wallet) {
    const blockhash = await this.connection.getLatestBlockhash("finalized");
    const final_tx = new VersionedTransaction(new TransactionMessage({
      payerKey: feePayer.publicKey,
      recentBlockhash: blockhash.blockhash,
      instructions: instructions
    }).compileToV0Message());
  
    final_tx.sign([feePayer.payer]);

    const txid = await this.connection.sendTransaction(final_tx, {
      skipPreflight: true,
    });

    await this.connection.confirmTransaction(txid);
    
    return txid;
  }

  /**
   * Internal buy
   * @param request 
   * @returns Instruction
   */
  async _buyOne(request: TransactionRequest) {
    const { walletSecretKey, mintAddress, amount, slippage } = request;
    const {ownerKeypair, wallet} = getParseWalletInfoFromSecretKey(walletSecretKey);
    const mint = new PublicKey(mintAddress);

    const {bondingCurve, associatedBondingCurve} = await getDetailsFromTokenMint(mintAddress);
    const associatedTokenPDA = findAssociatedTokenAddress(wallet.publicKey, mint);
    const associatedAddress = await createAssociatedTokenAccount(this.connection, ownerKeypair, mint);
    console.log(`Associated token address: ${associatedAddress}`);

    const buyInstruction = await this.makeBuyInstruction(
      wallet,
      mint,
      bondingCurve,
      associatedBondingCurve,
      associatedTokenPDA,
      amount,
      slippage
    );
    
    return buyInstruction;
  }

  /**
   * Buy one token from one wallet
   * @param request 
   * @returns Transaction Id
   */
  async buyOne (request: TransactionRequest) {
    const buyInstruction = await this._buyOne(request);
    const {ownerKeypair, wallet} = getParseWalletInfoFromSecretKey(request.walletSecretKey);
    const tx = await this.makeTransaction([buyInstruction], wallet);
    return tx;
  }

  /**
   * Internal Sell 
   * @param request 
   * @returns Transaction Id
   */
  async _sellOne (request: TransactionRequest) {
    const { walletSecretKey, mintAddress, amount, slippage } = request;
    const {ownerKeypair, wallet} = getParseWalletInfoFromSecretKey(walletSecretKey);
    const mint = new PublicKey(mintAddress);

    const {bondingCurve, associatedBondingCurve} = await getDetailsFromTokenMint(mintAddress);

    const associatedTokenPDA = findAssociatedTokenAddress(wallet.publicKey, mint);
    const associatedAddress = await createAssociatedTokenAccount(this.connection, ownerKeypair, mint);
    console.log(`Associated Address: ${associatedAddress}`);

    const sellInstruction = await this.makeSellInstruction(
      wallet,
      mint,
      bondingCurve,
      associatedBondingCurve,
      associatedTokenPDA,
      amount,
      slippage
    );

    return sellInstruction;
  }

  /**
   * Sell one token from one wallet
   * @param request 
   * @returns Transaction Id
   */
  async sellOne(request: TransactionRequest) {
    const sellInstruction = await this._sellOne(request);
    const {ownerKeypair, wallet} = getParseWalletInfoFromSecretKey(request.walletSecretKey);
    const tx = await this.makeTransaction([sellInstruction], wallet);
    return tx;

  }

  /**
   * Buy one token from multiple wallets
   * @param requests 
   * @param payerWalletSecretKey 
   * @returns Transaction Id
   */
  async buyMultiple(requests: Array<TransactionRequest>, payerWalletSecretKey: string) {
    const buyInstructions = await Promise.all(requests.map((request) => this._buyOne(request)));
    const { wallet } =  getParseWalletInfoFromSecretKey(payerWalletSecretKey);
    const tx = await this.makeTransaction(buyInstructions, wallet);
    return tx;
  }

  /**
   * Sell one token from multiple wallets
   * @param requests 
   * @param payerWalletSecretKey 
   * @returns Transaction Id
   */
  async sellMultiple(requests: Array<TransactionRequest>, payerWalletSecretKey: string) {
    const sellInstructions = await Promise.all(requests.map((request) => this._sellOne(request)));
    const { wallet } =  getParseWalletInfoFromSecretKey(payerWalletSecretKey);
    const tx = await this.makeTransaction(sellInstructions, wallet);
    return tx;
  }
}

/**
 * Get the exchange rate
 * @param purchaseAmount Number
 * @param liquidityPool Object
 * @returns Big Number
 */
const exchangeRate = (purchaseAmount: number, liquidityPool: any) => {
  let tokensSold;
  const totalLiquidity = liquidityPool.virtualSolReserves.mul(liquidityPool.virtualTokenReserves);
  const newSolReserve = liquidityPool.virtualSolReserves.add(new BN(purchaseAmount));
  const pricePerToken = totalLiquidity.div(newSolReserve).add(new BN(1));

  tokensSold = liquidityPool.virtualTokenReserves.sub(pricePerToken);
  tokensSold = BN.min(tokensSold, liquidityPool.realTokenReserves);
  return tokensSold;
};

const sellQuote = (sellAmount: number, liquidityPool: any) => {
  return new BN(sellAmount).mul(liquidityPool.virtualSolReserves).div(new BN(liquidityPool.virtualTokenReserves));
};

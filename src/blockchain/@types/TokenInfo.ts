export interface TokenInfo {
  mint: string,
  owner: string,
  name: string,
  symbol: string,
  uri: string,
  amount: Number,
  decimals: Number,
  uiAmount: Number,
  uiAmountString: string,
};

export interface TransactionRequest {
  walletSecretKey: string,
  mintAddress: string,
  amount: number,
  slippage: number,
  jitoTip: number
};

export interface WalletInfo {
  wallet: string,
  balance: number,
  solBuy: number,
  delayms: number,
  slippage: number,
  jitoTip: number,
};

export interface WalletBuyTableItemParam {
  publicKey: string,
  PRIVATE_KEY: string,
  buyAmountSOL: number,
  slippage: number,
  buyDelayMs: number,
  jitoTip: number,
  solBalance: number,
  checked: boolean
};

export interface BuyRequest {
  index: number,
  walletKey: string,
  buyAmount: number,
  slippage: number,
  jitoTip: number,
  mintAddress: string
};

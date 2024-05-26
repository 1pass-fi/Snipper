import { PumpTransaction } from "./pumpTransaction";
import { TransactionRequest } from "../@types/TokenInfo";

export class JitoTransaction {
  pumpTransaction: PumpTransaction;
  url: string;
  apiKey: string;
  constructor(clusterUri: string, url: string, apiKey: string) {
    this.pumpTransaction = new PumpTransaction(clusterUri, url, apiKey);
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Bundle buy transaction with jito
   * @param actionRequests 
   * @param jitoTip 
   * @returns Transaction Id
   */
  async buyWithJito(actionRequests: Array<TransactionRequest>) {
    const txs = await Promise.all(actionRequests.map((request) => this.pumpTransaction.buyOne(request)));
    const data = await fetch(`${this.url}/send-bundle`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        authorization: this.apiKey
      },
      body: JSON.stringify(txs.map(tx => Array.from(tx)))
    });
    return await data.text();
  }

  /**
   * Bundle sell transaction with jito
   * @param actionRequests 
   * @param jitoTip 
   * @returns Transaction Id
   */
  async sellWithJito(actionRequests: Array<TransactionRequest>) {
    const txs = await Promise.all(actionRequests.map((request) => this.pumpTransaction.sellOne(request)));
    const data = await fetch(`${this.url}/send-bundle`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        authorization: this.apiKey
      },
      body: JSON.stringify(txs.map(tx => Array.from(tx)))
    });
    return await data.text();
  }
}
import { PumpTransaction } from "./pumpTransaction";
import { TransactionRequest } from "../@types/TokenInfo";

export class JitoTransaction {
  pumpTransaction: PumpTransaction;
  constructor(clusterUri: string) {
    this.pumpTransaction = new PumpTransaction(clusterUri);
  }

  /**
   * Bundle buy transaction with jito
   * @param actionRequests 
   * @param jitoTip 
   * @returns Transaction Id
   */
  async buyWithJito(actionRequests: Array<TransactionRequest>, jitoTip: number) {
    const jitoTx = await this.pumpTransaction.makeJitoTipTransaction(actionRequests[0].walletSecretKey, jitoTip);
    if (!jitoTx) {
      return;
    }
    const txs = await Promise.all(actionRequests.map((request) => this.pumpTransaction.buyOne(request)));
    txs.push(jitoTx);
    const data = await fetch('http://49.13.165.12:80/send-bundle', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'sodamnapikey'
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
  async sellWithJito(actionRequests: Array<TransactionRequest>, jitoTip: number) {
    const jitoTx = await this.pumpTransaction.makeJitoTipTransaction(actionRequests[0].walletSecretKey, jitoTip);
    if (!jitoTx) {
      return;
    }
    const txs = await Promise.all(actionRequests.map((request) => this.pumpTransaction.sellOne(request)));
    txs.push(jitoTx);
    const data = await fetch('http://49.13.165.12:80/send-bundle', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'sodamnapikey'
      },
      body: JSON.stringify(txs.map(tx => Array.from(tx)))
    });
    return await data.text();
  }
}
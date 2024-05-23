import axios, { AxiosResponse } from 'axios';
import { VersionedTransaction } from '@solana/web3.js';

export class JitoTsBackend {
  constructor(private readonly url: string, private readonly apiKey: string) {}

  /**
   * Get tip accounts
   * @returns Array<string>
   */
  public tipAccounts = () =>
    axios
      .get<string[]>(this.url + '/tip-accounts', {
        headers: {
          Authorization: this.apiKey,
          'Access-Control-Allow-Origin': this.url,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
      .then((res) => res.data);

  /**
   * Send Jito Bundle
   * @param versionedTransactions 
   * @returns Transaction Id
   */
  public sendBundle = (versionedTransactions: VersionedTransaction[]) =>
    axios
      .post<string, AxiosResponse<string>, number[][]>(
        this.url + '/send-bundle',
        versionedTransactions.map((versionedTransaction) => Array.from(versionedTransaction.serialize())),
        {
            headers: {
                Authorization: this.apiKey,
            },
        },
      )
      .then((res) => res.data);
}
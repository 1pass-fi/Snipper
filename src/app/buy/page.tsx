"use client";
import axios from "axios";
import Papa from "papaparse";
import { ChangeEvent, useState } from "react";
import { TokenAddressContext } from "@/context/tokenAddresContext";
import File from "@/components/File";
import Button from '@/components/Button';
import WalletBuyTable from "@/components/WalletBuyTable/WalletBuyTable";

const ClientComponent = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [filePath, setFilePath] = useState('');
  const [walletData, setWalletData] = useState<any>(null);

  const changeFilePath = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setFilePath(event.target.value);
    if (!event.target.files) {
      return;
    }
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!results.data) return;
        const promises = results.data.map((item: any) => {
          return axios.post('/api/load-wallet-info', {
            key: item.PRIVATE_KEY
          });
        });
        const solBalances = await Promise.all(promises);
        const walletInfo = results.data.map((item: any, index) => ({
          ...item,
          solBalance: solBalances[index].data.solBalance / Math.pow(10, 9),
          publicKey: solBalances[index].data.publicKey
        }));
        console.log(walletInfo);
        setWalletData(walletInfo);
      },
      error: (err) => {
        console.log(err);
      },
    });
  };

  const clearWallets = (event: MouseEvent) => {
    event.preventDefault();
    setWalletData([]);
  };

  const changeTokenAddress = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setTokenAddress(event.target.value);
    console.log(event.target.value);
  }

  return (
    <TokenAddressContext.Provider value={{
      tokenAddress,
      setTokenAddress
    }}>
      <div>
        <input className="text-xs p-2 m-2 w-80" type="text" value={tokenAddress} onChange={e => changeTokenAddress(e)} />
      </div>
      <div>
        <File value={filePath} onChange={changeFilePath} />
        <Button value="Clear wallets" onClick={clearWallets} />
      </div>
      <div>
        <WalletBuyTable data={walletData}/>
      </div>
    </TokenAddressContext.Provider>
  )
}

export default ClientComponent;

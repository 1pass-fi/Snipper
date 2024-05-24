import axios from "axios";
import { useCallback, useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { BuyRequest } from "@/@types";
import WalletBuyTableItem from "./WalletBuyTableItem";
import Button from "../Button";

const WalletBuyTable = ({data}: {
  data: Array<any>
}) => {
  const [checkedWallets, setCheckedWallets] = useState<Array<BuyRequest>>([]);
  const updateBuyWallets = useCallback((data: BuyRequest) => {
    const currentWallet = checkedWallets.find((item: BuyRequest) => item.index === data.index);
    let newCheckedWallets = [];
    if (currentWallet) {
      newCheckedWallets = checkedWallets.filter((item: BuyRequest) => item.index !== data.index);
    } else {
      newCheckedWallets = [
        ...checkedWallets,
        data
      ];
    }

    console.log(newCheckedWallets);
    setCheckedWallets(newCheckedWallets);
  }, [checkedWallets, setCheckedWallets]);

  const dataWithCheck = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      checked: checkedWallets.find(item => item.index === index) ? true : false
    }));
  }, [data, checkedWallets]);

  if (!data || data.length === 0) {
    return (
      <div className="text-white">
        No wallet data
      </div>
    )
  }

  const buyAllChecked = async (e: MouseEvent) => {
    e.preventDefault();
    const res = await axios.post('/api/buy-transaction', {
      data: checkedWallets.map(({walletKey, buyAmount, slippage, jitoTip, mintAddress}: BuyRequest) => ({
        walletKey: walletKey,
        buyAmount: buyAmount,
        slippage: slippage,
        jitoTip: jitoTip,
        mintAddress: mintAddress
      }))
    });
    console.log(res.data.jitoTx);
  }

  return (
    <table className="table-auto md:table-fixed min-w-full text-white	text-sm	font-thin  mx-auto ">
      <thead>
        <tr className="">
          <th className="w-1/10">Wallets</th>
          <th className="w-1/10">Balance</th>
          <th className="w-1/10">SOL Buy</th>
          <th className="w-1/10">Delay (ms)</th>
          <th className="w-1/10">Slippage</th>
          <th className="w-1/10">JitoTip</th>
          <th className="w-1/10"><Button value="BUY ALL CHECKED" onClick={buyAllChecked}/></th>
        </tr>
      </thead>
      <tbody>
        {
          dataWithCheck.map((item, index) => (
            <WalletBuyTableItem key={nanoid()} item={item} index={index} updateBuyWallets={updateBuyWallets} />
          ))
        }
      </tbody>
    </table>
  );
};

export default WalletBuyTable;
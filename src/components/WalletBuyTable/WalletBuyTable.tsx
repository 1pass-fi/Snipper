import axios from "axios";
import { useCallback, useState, useMemo, useContext } from "react";
import { nanoid } from "nanoid";
import { BuyRequest } from "@/@types";
import WalletBuyTableItem from "./WalletBuyTableItem";
import { TokenAddressContext } from "@/context/tokenAddresContext";
import Button from "../Button";

const WalletBuyTable = ({data, onChangeField}: {
  data: Array<any>,
  onChangeField: (index: number, field: string, value: string) => void  
}) => {
  const {tokenAddress} = useContext(TokenAddressContext);
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
    return !data ? [] : data.map((item, index) => ({
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
    if (!tokenAddress) {
      alert("Please enter token address");
      return;
    }
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
    alert(`Buy transaction id: ${res.data.jitoTx}`);
  }

  const changeFields = (index: number, field: string, value: string) => {
    onChangeField(index, field, value);
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
            <WalletBuyTableItem
              key={`${item.publicKey} - ${index}`}
              item={item}
              index={index}
              updateBuyWallets={updateBuyWallets}
              onChangeField={changeFields}/>
          ))
        }
      </tbody>
    </table>
  );
};

export default WalletBuyTable;
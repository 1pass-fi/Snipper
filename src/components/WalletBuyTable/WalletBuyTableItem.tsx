import { ChangeEvent, useContext, useState, useEffect } from "react";
import axios from "axios";
import { WalletBuyTableItemParam, BuyRequest } from "@/@types";
import { TokenAddressContext } from "@/context/tokenAddresContext";
import Button from "../Button";

const WalletBuyTableItem = ({item, index, updateBuyWallets, onChangeField}: {
  item: WalletBuyTableItemParam,
  index: number,
  updateBuyWallets: (data: BuyRequest) => void,
  onChangeField: (index: number, field: string, value: string) => void
}) => {
  const {tokenAddress} = useContext(TokenAddressContext);
  const {PRIVATE_KEY, buyAmountSOL, slippage, buyDelayMs, jitoTip, solBalance, publicKey} = item;

  const clickBuy = (e: MouseEvent) => {
    if (!tokenAddress) {
      alert("Please enter token address");
      return;
    }
    setTimeout(async () => {
      const res = await axios.post('/api/buy-transaction', {
        data: [{
          walletKey: PRIVATE_KEY,
          buyAmount: buyAmountSOL,
          slippage: slippage,
          jitoTip: jitoTip,
          mintAddress: tokenAddress
        }]
      });
      console.log(res.data.jitoTx);
      alert(`Buy transaction id: ${res.data.jitoTx}`);
    }, item.buyDelayMs);
  };

  const changeCheck = (event: ChangeEvent<HTMLInputElement>) => {
    updateBuyWallets({
      index,
      walletKey: PRIVATE_KEY,
      buyAmount: buyAmountSOL,
      slippage: slippage,
      jitoTip: jitoTip,
      mintAddress: tokenAddress
    });
  };

  const changeFields = (field: string, event: ChangeEvent<HTMLInputElement>) => {
    onChangeField(index, field, event.target.value);
  }

  return (
    <tr className={`${index % 2 ? 'bg-slate-800' : 'bg-slate-600'} px-2 py-4`}>
      <td className="px-2">{publicKey}</td>
      <td className="px-2">
        {solBalance}
      </td>
      <td className="px-2">
        <input className="text-xs p-2 m-2 w-30 text-black font-semibold	" type="text" value={buyAmountSOL} onChange={e => changeFields("buyAmountSOL", e)} />
      </td>
      <td className="px-2">
        <input className="text-xs p-2 m-2 w-30 text-black font-semibold	" type="text" value={buyDelayMs} onChange={e => changeFields("buyDelayMs", e)} />
      </td>
      <td className="px-2">
        <input className="text-xs p-2 m-2 w-30 text-black font-semibold	" type="text" value={slippage} onChange={e => changeFields("slippage", e)} />
      </td>
      <td className="px-2">
        <input className="text-xs p-2 m-2 w-30 text-black font-semibold	" type="text" value={jitoTip} onChange={e => changeFields("jitoTip", e)} />
      </td>
      <td className="px-2">
        <Button value="Buy" onClick={clickBuy}/>
        <input className="ml-2" type="checkbox" checked={item.checked} onChange={e => changeCheck(e)} />
      </td>
    </tr>
  )
};

export default WalletBuyTableItem;

import { Connection, PublicKey } from "@solana/web3.js";


const subscribe = async (connection: Connection, wallet: PublicKey) => {
  await connection.onAccountChange(wallet, (updatedAccountInfo) => {
    console.log(updatedAccountInfo);
  })
};

export {
  subscribe
};

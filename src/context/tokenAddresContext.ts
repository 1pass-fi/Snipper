import { createContext } from "react";

const TokenAddressContext = createContext({
  tokenAddress: "",
  setTokenAddress: () => {}
});

export {
  TokenAddressContext
};

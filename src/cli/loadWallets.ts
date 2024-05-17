import fs from 'fs';
import { config } from 'dotenv';
import { Command } from "commander";
import { Connection, Keypair } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { loadWalletFromPrivateKeys, loadWallets } from '../utils/utils.js';

const program = new Command();

// Set the name, version and description
program
  .version('1.0.0')
  .description('Pump.fun volume marker trading bot');

program
  .option('-c, --csv <csv>', 'Provide the csv file path for multiple wallets')
  .option('-o, --output <output>', 'Provide the output file path for multiple wallets');

program.parse(process.argv);

(async() => {
  const options = program.opts();
  if (!options.csv) {
    console.log('Csv file path is not provided!');
    return;
  }
  if (!options.output) {
    console.log('Output file path is not provided!');
    return;
  }
  config();
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const metaplex = Metaplex.make(connection);

  // Get the wallet private keys from file
  const walletConfigs = await loadWallets(options.csv);
  const privateKeys = walletConfigs.map(({PRIVATE_KEY}) => PRIVATE_KEY);

  // Get the wallet info from private keys
  const result = await loadWalletFromPrivateKeys(connection, metaplex, privateKeys);

  // Save wallet info to file
  fs.writeFile(options.output, JSON.stringify(result, null, 2), (err) => {
    if (err) {
      console.log('Error writing file', err);
    } else {
      console.log(`Wallet info saved in file ${options.output}`);
    }
  });
})();

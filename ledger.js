import SuiLedgerClient from '@mysten/ledgerjs-hw-app-sui';
import { LedgerSigner } from '@mysten/signers/ledger';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";


let transport = await TransportNodeHid.default.create();

const ledgerClient = new SuiLedgerClient(transport);
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

const signer = await LedgerSigner.fromDerivationPath(
	"m/44'/784'/0'/0'/0'",
	ledgerClient,
	suiClient,
);

// Log the Sui address:
console.log(signer.toSuiAddress());

// Define a test transaction:
const tx = new Transaction();

tx.setSender("0xe2a723d4be8386b9203d00293c309cb346a1ab82be510784d6312a6ad14d0e86")
tx.setGasPrice(100000);
tx.setGasBudget(100000000);

const transactionBytes = await tx.build({ client: suiClient });

// Sign a test transaction:
const { signature } = await signer.signTransaction(transactionBytes);
console.log(signature);

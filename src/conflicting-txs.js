import {Faucet, client, keypair} from './utils.js';
import { Transaction } from '@mysten/sui/transactions';

await Faucet();
let parallelTxs = []

for (var i = 0; i < 5; i++) {
    let tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [i+1]);

    // transfer the split coin to a specific address
    tx.transferObjects([coin], '0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca');

    parallelTxs.push(client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
    }));
}

console.log(`sending ${parallelTxs.length} conflicting TXs`);
const result =  await Promise.all(parallelTxs)

console.log(`running equivocation test`)
console.log(result);
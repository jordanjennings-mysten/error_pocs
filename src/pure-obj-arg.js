import {Deploy, Faucet, client, keypair} from './utils.js';
import { Transaction, bcs } from '@mysten/sui/transactions';

// await Faucet();
// let {packageId} = await Deploy('runtime');



const tx = new Transaction();

let arg = tx.pure.object;
console.log(arg);


// tx.moveCall({
//     target: `${packageId}::error_pocs::return_value`,
//     arguments: [tx.pure.u64(1)],
// })
//
// console.log('sign');
// let result = await client.signAndExecuteTransaction({
//     transaction: tx,
//     signer: keypair,
// })
// console.log('wait for tx');
// await client.waitForTransaction({ digest: result.digest });
import {Deploy, Faucet, client, keypair} from './utils.js';
import { Transaction } from '@mysten/sui/transactions';

async function run_test(testName) {
    await Faucet();
    let {packageId} = await Deploy('runtime');

    const tx = new Transaction();
    tx.moveCall({
        target: `${packageId}::error_pocs::${testName}`
    })
    tx.setGasBudget(10000000);  // Set your gas budget here

    console.log('sign');
    let result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
    })
    console.log('wait for tx');
    await client.waitForTransaction({ digest: result.digest });

    console.log(await client.getTransactionBlock({
        digest: result.digest,
        options: {
            showEffects: true,
            showObjectChanges: true,
            showInput: true,
            showEvents: true,
            showBalanceChanges: true,
        }
    }));

}

if (process.argv.length < 3) {
    console.log('provide a test name');
} else {
    let testName = process.argv[2];
    console.log(`running test ${testName}`)

    run_test(testName)
        .then(()=> console.log('done'))
        .catch((e) => console.log(e))
}

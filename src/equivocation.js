import {Deploy, Faucet, client, keypair} from './utils.js';
import { Transaction } from '@mysten/sui/transactions';


async function getCoins() {
    let address_str = "0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca";
    let address = Buffer.from(address_str, 'hex');
    let coins = await client.getCoins({
        owner: address_str,
    });

    if (coins.length == 0) {
        await Faucet();
        coins = await client.getCoins(keypair.publicKey);
    }
    console.log(coins);

    return coins;
}

async function run() {
    await Faucet();

    let tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [100]);

    // transfer the split coin to a specific address
    tx.transferObjects([coin], '0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca');

    let parallelTxs = []

    for (var i = 0; i < 20; i++) {
        parallelTxs.push(client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
        }));
    }

    console.log(`sending the same tx multiple ${parallelTxs.length} times`);
    await Promise.all(parallelTxs)
}


console.log(`running equivocation test`)


// await getCoins();
await run();
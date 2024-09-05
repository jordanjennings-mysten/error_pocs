import {Deploy, Faucet, client, keypair} from './utils.js';
import { Transaction } from '@mysten/sui/transactions';


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

import { Faucet } from './utils.js';

console.log('Requesting funds from faucet...');
Faucet()
    .then(() => console.log('Faucet request successful!'))
    .catch((e) => {
        console.error('Faucet request failed:');
        console.error(e);
        process.exit(1);
    });

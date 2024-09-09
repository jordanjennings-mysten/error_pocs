import {execSync, exec} from 'child_process';
import {Deploy, Faucet, client, keypair} from './utils.js';
import { Transaction } from '@mysten/sui/transactions';


await Faucet();
let {packageId, updateCap} = await Deploy();

console.log('packageId', packageId);
console.log('upgrade capability', updateCap);
// exec(`sui client upgrade --upgrade-capability ${updateCap} --skip-dependency-verification`,
//     (error, stdout, stderr) => {
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return;
//         }
//         console.log(`stdout: ${stdout}`);
//         console.error(`stderr: ${stderr}`);
//     });

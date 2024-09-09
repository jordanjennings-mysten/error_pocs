import {execSync, exec} from 'child_process';
import {Deploy, Faucet, client, keypair, upgradePackage} from './utils.js';
import { Transaction } from '@mysten/sui/transactions';
import {promises as fs} from 'fs';

// reset the package to the original state by taking upgrades-versions/v1.move and
// putting it in upgrades/sources/upgrades.move
await fs.cp('upgrades-versions/v1.move', 'upgrades/sources/upgrades.move', {overwrite: true});

// deploy the package
await Faucet();
let {packageId, updateCap} = await Deploy('upgrades');

// "modify" the move code in the project
await fs.cp('upgrades-versions/v2.move', 'upgrades/sources/upgrades.move', {overwrite: true});

let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${packageId}"`);
await fs.writeFile('./upgrades/Move.toml', moveToml);

// upgrade the package
await upgradePackage('upgrades', updateCap);




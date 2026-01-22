import {Deploy, Faucet, client, keypair} from './utils.js';
import * as utils from "./utils.js";

import SuiLedgerClient from '@mysten/ledgerjs-hw-app-sui';
import { LedgerSigner } from '@mysten/signers/ledger';
import { Transaction } from '@mysten/sui/transactions';
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

async function run_test(testName, executionMode) {
    const balance = await client.getBalance({ owner: utils.address });
    if (BigInt(balance.totalBalance) === 0n) {
        throw new Error(`Insufficient balance for address ${utils.address}. Please use local faucet.`);
    }
    console.log(`Current balance: ${balance.totalBalance}`);
    
    // Attempt to simulate VMVerificationOrDeserializationError by publishing a corrupted module
    console.log('Building package...');
    const buildResult = await utils.buildPackage('ptb');
    let modules = buildResult.modules;
    const dependencies = buildResult.dependencies;

    // Corrupt the first module
    if (modules.length > 0) {
        console.log('Corrupting module bytecode...');
        // Decode base64 to bytes
        let moduleBytes = Buffer.from(modules[0], 'base64');
        // Mutate some bytes in the middle to likely invalidate bytecode verification
        // (Avoiding header mutations which might just say "Not a module")
        if (moduleBytes.length > 20) {
             moduleBytes[moduleBytes.length - 1] = moduleBytes[moduleBytes.length - 1] ^ 0xFF; // Flip last byte
             moduleBytes[moduleBytes.length - 5] = 0xAA; 
        }
        modules[0] = moduleBytes.toString('base64');
    }

    console.log('Publishing corrupted package...');
    const tx = new Transaction();
    const cap = tx.publish({
        modules,
        dependencies,
    });
    tx.transferObjects([cap], tx.pure.address(utils.address));

    tx.setSender(utils.address)
    tx.setGasPrice(100000);
    tx.setGasBudget(100000000);

    let bcs = await tx.build({ client });

    if (executionMode === 'dryrun') {
        try {
            let dry_run_result = await client.dryRunTransactionBlock({
                transactionBlock: bcs,
            });
            console.log('dry run result');
            console.log(dry_run_result);
            console.log();
        } catch (e) {
            console.log('dry run error');
            console.log(JSON.stringify(e, null, 2));
        }
    } else if (executionMode === 'devinspect') {
        try {
            let dev_inspect_result = await client.devInspectTransactionBlock({
                sender: utils.address,
                transactionBlock: bcs,
            });
            console.log('dev inspect result');
            console.log(dev_inspect_result);
            console.log();
        } catch (e) {
            console.log('dev inspect error');
            console.log(JSON.stringify(e, null, 2));
        }
    } else if (executionMode === 'normal') {
        try {
            let normal_execution_result = await client.signAndExecuteTransaction({
                transaction: tx,
                signer: keypair,
                // options: {
                //     showEffects: true,
                // }
            })
            console.log('normal execution result');
            console.log(normal_execution_result);
        } catch (e) {
            console.log('execution error');
            console.log(JSON.stringify(e, null, 2));
        }
    }
}


let testName = 'vm_deserialization';
const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('Usage: node vm-deserialization-error.js <normal|dryrun|devinspect> [testName]');
    process.exit(1);
}

const executionMode = args[0];
const allowedModes = ['normal', 'dryrun', 'devinspect'];

if (!allowedModes.includes(executionMode)) {
    console.error(`Error: Invalid execution mode '${executionMode}'. Must be one of: ${allowedModes.join(', ')}`);
    process.exit(1);
}

if (args.length >= 2) {
    testName = args[1];
}

console.log(`running test ${testName} with mode ${executionMode}`)

run_test(testName, executionMode)
    .then(()=> console.log('done'))
    .catch((e) => console.log(e))

function call(tx, pkg, function_name, arg) {
    tx.moveCall({
        target: `${pkg}::ptb::${function_name}`,
        arguments: (arg) ? [arg] : null,
    })

    return tx;
}

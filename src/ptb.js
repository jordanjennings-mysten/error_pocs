import {Deploy, Faucet, client, keypair} from './utils.js';
import { Transaction, Inputs } from '@mysten/sui/transactions';

async function run_test(testName) {
    await Faucet();
    let {packageId} = await Deploy('ptb');

    let tx = new Transaction();
    if (testName === 'borrowed_to_owned') {
        tx = call_a_pass_to_b(tx, packageId, testName, tx.pure.u64(1));
    } else if (testName === 'owned_to_borrowed') {
        // no error?
        tx = call_a_pass_to_b(tx, packageId, testName);
    } else if (testName === 'u32_to_u64') {
        tx = call_a_pass_to_b(tx, packageId, testName);
    } else if (testName === 'basic_with_arg') {
        tx = call(tx, packageId, testName, tx.pure.u64(1));
    } else if (testName === 'copy_owned_to_owned') {
        tx = call_a_pass_to_b(tx, packageId, testName);
    } else if (testName === 'drop_owned_to_owned') {
        tx = call_a_pass_to_b(tx, packageId, testName);
    } else {
        throw new Error(`unknown test ${testName}`);
    }

    console.log('sign');
    let result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
    })
    console.log('wait for tx');
    await client.waitForTransaction({ digest: result.digest });
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

function  call_a_pass_to_b(tx, pkg, function_name, first_arg) {
    let ret = tx.moveCall({
        target: `${pkg}::ptb::${function_name}_1`,
        arguments: (first_arg) ? [first_arg] : null,
    })

    tx.moveCall({
        target: `${pkg}::ptb::${function_name}_2`,
        arguments: [ret],
    })

    return tx;
}

function call(tx, pkg, function_name, arg) {
    tx.moveCall({
        target: `${pkg}::ptb::${function_name}`,
        arguments: (arg) ? [arg] : null,
    })

    return tx;
}


function test_no_funds() {
    // remove funds from wallet

    let tx = new Transaction();
}



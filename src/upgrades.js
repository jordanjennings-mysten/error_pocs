import {client, address, keypair, Deploy, Faucet, exists, upgradePackage, buildPackage} from './utils.js';
import { fromB58, toB58 } from '@mysten/bcs'
import {promises as fs} from 'fs';
import {Transaction, UpgradePolicy} from "@mysten/sui/transactions";

let testName = process.argv[2];

// if the move file exists for the testName then run the test from the upgrades-versions directory
if (await exists(`upgrades-versions/${testName}-v1.move`)) {
    // reset the package to the original state by taking upgrades-versions/v1.move and
    // putting it in upgrades/sources/upgrades.move
    await fs.cp(`upgrades-versions/${testName}-v1.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {packageId, updateCap} = await Deploy('upgrades');

    // "modify" the move code in the project
    await fs.cp(`upgrades-versions/${testName}-v2.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
    moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${packageId}"`);
    await fs.writeFile('./upgrades/Move.toml', moveToml);

    // upgrade the package
    await upgradePackage('upgrades', updateCap);
} else {
    let tests = {
        'UpgradeACoin': UpgradeACoinTest,
        // 'UnknownUpgradePolicy': UnknownUpgradePolicyTest,
        'PackageIDDoesNotMatch':  PackageIDDoesNotMatchTest,
        // 'UpgradeTheWrongPackageId': UpgradeTheWrongPackageIdTest,
        'BadUpgradePolicy': BadUpgradePolicyTest,
        'MixupUpgradeCaps': MixupUpgradeCapsTest,
        'UpgradeImmutable': UpgradeImmutableTest,
        'UpgradeTwice': UpgradeTwiceTest,
        'ApplyCustomPolicy': ApplyCustomPolicyTest,
    }
    if (tests[testName]) {
        await tests[testName]();
    } else {
        console.log('Unknown test name');
    }
}

async function UpgradeACoinTest() {
    // get a coin id
    let coins = await client.getCoins({owner: '0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca'})
    let coinId = coins.data[0].coinObjectId;

    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {packageId, updateCap} = await Deploy('upgrades');

    // write the coinId as the package instead of the packageId
    console.log(`upgrading "package" ${coinId} coinId`)
    let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
    moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${coinId}"`);
    await fs.writeFile('./upgrades/Move.toml', moveToml);

    // upgrade the package
    await upgradePackage('upgrades', updateCap);
}

async function UpgradeWithAnObjectTest() {

}

async function UpgradeWithAPackageId() {

}

async function PackageIDDoesNotMatchTest() {
    // our bad backage which will cause the matching error
    let badPackage = "0x1";

    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {updateCap} = await Deploy('upgrades');

    // write the bad package as the package instead of the packageId
    console.log(`upgrading to our "bad package" ${badPackage}`)
    let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
    moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${badPackage}"`);
    await fs.writeFile('./upgrades/Move.toml', moveToml);

    // upgrade the package
    await upgradePackage('upgrades', updateCap);
}

async function MixupUpgradeCapsTest() {
    // our bad backage which will cause the matching error
    let badPackage = "0x1";

    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {updateCap} = await Deploy('upgrades');

    // write the bad package as the package instead of the packageId
    console.log(`upgrading to our "bad package" ${badPackage}`)
    let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
    moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${badPackage}"`);
    await fs.writeFile('./upgrades/Move.toml', moveToml);

    // upgrade the package
    await upgradePackage('upgrades', updateCap);
}

async function UpgradeImmutableTest() {
    // our bad backage which will cause the matching error

    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {packageId, upgradeCap} = await Deploy('upgrades');

    // let tx = new Transaction();
    //
    // tx.moveCall({
    //     target: `${packageId}::package::make_immutable`,
    //     arguments: [upgradeCap],
    // });
    //
    // const { digest } = await client.signAndExecuteTransaction({
    //     transaction: tx,
    //     signer: keypair,
    // });
    //
    // await client.waitForTransaction({
    //     digest: digest,
    // });
    //
    // // try upgrading
    // await upgradePackage('upgrades', upgradeCap);
}

async function UpgradeTwiceTest() {
    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {packageId, updateCap} = await Deploy('upgrades');

    // write the bad package as the package instead of the packageId
    let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
    moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${packageId}"`);
    await fs.writeFile('./upgrades/Move.toml', moveToml);

    // upgrade the package
    console.log(`upgrading once ${packageId}`);
    await upgradePackage('upgrades', updateCap);

    // upgrade the package again
    console.log(`upgrading twice ${packageId}`);
    await upgradePackage('upgrades', updateCap);
}

// happy path demonstration purposes, no errors
// TODO this is broken, cannot continue with the custom policy tests
async function ApplyCustomPolicyTest() {
    console.log("CUSTOM POLICY");
    // setup and deploy the custom policy
    await fs.cp(`upgrades-versions/custom-policy.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    await Faucet();
    let {packageId: policyPackageId} = await Deploy('upgrades');

    // publish nudge.move with custom policy
    await fs.cp(`upgrades-versions/nudge.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    let result;
    let customPolicyUpgradeCap;
    {
        let {modules, dependencies, digest: buildDigest} = await buildPackage('upgrades');

        const tx = new Transaction();
        // create a new transaction to publish nudge.move
        const packageUpgradeCap = tx.publish({modules, dependencies});
        customPolicyUpgradeCap = tx.moveCall({
            target: `${policyPackageId}::policy_day_of_week::new_policy`,
            arguments: [
                packageUpgradeCap,
                tx.pure.u8(1), // Tuesday
            ],
        });

        tx.transferObjects([customPolicyUpgradeCap], tx.pure.address(address));

        // execute nudge publish
        let {digest} =  await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: { showObjectChanges: true, showEffects: true },
        });

        result = await client.waitForTransaction({
            digest,
            options: { showObjectChanges: true, showEffects: true },
        });
    }

    {
        await fs.cp(`upgrades-versions/nudge.move`, 'upgrades/sources/upgrades.move', {overwrite: true});
        let {modules, dependencies, digest: buildDigest} = await buildPackage('upgrades');


        let nudgePackageId = result.objectChanges.filter((a) => a.type === 'published')[0].packageId;
        let wrappedUpdateCap = result.objectChanges.filter((a) => a.type === 'created')[0].objectId;

        console.log('wrapped cap', wrappedUpdateCap);
        console.log('build digest', buildDigest);
        // Get a ticket for upgrading
        const tx = new Transaction();
        const cap = tx.object(wrappedUpdateCap);
        const ticket = tx.moveCall({
            target: `${policyPackageId}::policy_day_of_week::authorize_upgrade`,
            arguments: [cap, tx.pure.u8(0), tx.pure.vector('u8', buildDigest)],
        });

        console.log('transfer to me', address);
        tx.transferObjects([ticket], address);

        console.log('first args', [cap, tx.pure.u8(0), tx.pure.vector('u8', buildDigest)])

        // use the ticket
        const receipt = tx.upgrade({
            modules,
            dependencies,
            packageId: nudgePackageId,
            ticket,
        });

        console.log('second args', [cap, receipt]);
        // commit the cap
        tx.moveCall({
            target: `${policyPackageId}::policy_day_of_week::commit_upgrade`,
            arguments: [cap, receipt],
        });

        console.log("SET SENDER", address);
        // build tx
        tx.setSenderIfNotSet(address)
        await tx.build({ client });

        console.log('upgrade the package');
        let {digest: digest_upgrade} = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {

            }
        });

        await client.waitForTransaction({
            digest: digest_upgrade,
        });
    }
}

// change the upgrade policy to something that is invalid, valid policies: https://docs.sui.io/concepts/sui-move-concepts/packages/custom-policies
// TODO solutions
// - maybe possible with custom policy? custom policy test isn't working right now so cannot complete
// - set upgrade policy by modifying the sui move framework
async function BadUpgradePolicyTest() {
    throw new Error('TODO');
}
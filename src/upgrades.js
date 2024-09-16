import {
    client,
    address,
    keypair,
    Deploy,
    Faucet,
    exists,
    upgradePackage,
    buildPackage,
    upgradePackageCLI
} from './utils.js';
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
    await upgradePackageCLI('upgrades', updateCap);
} else {
    let tests = {
        // Upgrade Policy: Compatible
        'CorruptTicket': CorruptTicketTest,
        'ValidTicketDifferentModule': ValidTicketDifferentModuleTest,
        'CapFromOtherModule': CapFromOtherModuleTest,
        'UpgradeTwice': UpgradeTwiceTest,
        'UpgradeUsingPackageID': UpgradeUsingPackageIDTest,
        'UpgradeWithArbitraryObject': UpgradeWithArbitraryObjectTest,
        'UpgradeWithACoin': UpgradeWithACoinTest,
        'MixupUpgradeCaps': MixupUpgradeCapsTest,

        // Upgrade Policy: Immutable
        'UpgradeImmutable': UpgradeImmutableTest,

        // Upgrade Policy: Dependency-Only
        'AddFunctionOnDependencyOnly': AddFunctionOnDependencyOnlyTest,

        // Upgrade Policy: Additive
        'ChangeFunctionOnAdditive': ChangeFunctionOnAdditiveTest,

        // Other
        // 'UnknownUpgradePolicy': UnknownUpgradePolicyTest,
        'PackageIDDoesNotMatch':  PackageIDDoesNotMatchTest,
        // 'UpgradeTheWrongPackageId': UpgradeTheWrongPackageIdTest,
        // 'BadUpgradePolicy': BadUpgradePolicyTest,
        // 'MixupUpgradeCaps': MixupUpgradeCapsTest,
        // 'UpgradeTwice': UpgradeTwiceTest,
        // happy path not really a test
        // 'ApplyCustomPolicy': ApplyCustomPolicyTest,
    }
    if (tests[testName]) {
        await tests[testName]();
    } else {
        console.log('Unknown test name');
    }
}

async function CorruptTicketTest() {
    // cp in the simple move file
    fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy, get the build digest for ticket creation
    await Faucet();
    let {packageId, updateCap, buildDigest, modules, dependencies} = await Deploy('upgrades');

    console.log('build digest', buildDigest);
    console.log('update cap', updateCap);
    // Create ticket
    const tx = new Transaction();
    const cap = tx.object(updateCap);
    tx.transferObjects([updateCap], tx.pure.address(address));
    const ticket = tx.moveCall({
        target: '0x2::package::authorize_upgrade',
        arguments: [cap, tx.pure.u8(UpgradePolicy.COMPATIBLE), tx.pure.vector('u8', buildDigest)],
    });


    const receipt = tx.upgrade({
        modules,
        dependencies,
        package: packageId,
        ticket,
    });

    tx.transferObjects([receipt], tx.pure.address(address));
    tx.comm

    // tx.moveCall({
    //     target: '0x2::package::commit_upgrade',
    //     arguments: [cap, receipt],
    // });

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });

    await client.waitForTransaction({
        digest: result.digest,
    });
}

async function ValidTicketDifferentModuleTest() {
    throw new Error('TODO');
}

async function CapFromOtherModuleTest() {
    throw new Error('TODO');
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
    await upgradePackageCLI('upgrades', updateCap);

    // upgrade the package again
    console.log(`upgrading twice ${packageId}`);
    await upgradePackageCLI('upgrades', updateCap);
}

async function UpgradeUsingPackageIDTest() {
    throw new Error('TODO');
}

async function UpgradeWithArbitraryObjectTest() {
    throw new Error('TODO');
}

async function UpgradeWithACoinTest() {
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
    await upgradePackageCLI('upgrades', updateCap);
}

async function MixupUpgradeCapsTest() {
    await Faucet();


    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy package A
    let {packageId: packageIdA, updateCap: upgradeCapA} = await Deploy('upgrades');

    // deploy package B
    let {packageId: packageIdB, updateCap: upgradeCapB} = await Deploy('upgrades');

    // write the bad package as the package instead of the packageId
    console.log(`upgrading B with A cap A ${packageIdA} B ${packageIdB}`);
    let moveToml = await fs.readFile('./upgrades/Move.toml', 'utf-8');
    moveToml = moveToml.replace(/published-at = "(.*)"/, `published-at = "${packageIdB}"`);
    await fs.writeFile('./upgrades/Move.toml', moveToml);

    // upgrade the package
    await upgradePackageCLI('upgrades', upgradeCapA);
}

async function UpgradeImmutableTest() {
    // reset the package to the original state by taking upgrades-versions/simple.move and
    await fs.cp(`upgrades-versions/simple.move`, 'upgrades/sources/upgrades.move', {overwrite: true});

    // deploy the package
    await Faucet();
    let {packageId, updateCap} = await Deploy('upgrades');

    let tx = new Transaction();
    console.log('upgrade cap', updateCap);

    tx.moveCall({
        target: `0x2::package::make_immutable`,
        arguments: [tx.object(updateCap)],
    });

    const { digest } = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
    });

    await client.waitForTransaction({
        digest: digest,
    });

    console.log('UPGRADING WITH CAP', updateCap);

    // try upgrading
    await upgradePackageCLI('upgrades', updateCap);
}

async function AddFunctionOnDependencyOnlyTest() {

}

async function ChangeFunctionOnAdditiveTest() {
    new Er
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
    await upgradePackageCLI('upgrades', updateCap);
}


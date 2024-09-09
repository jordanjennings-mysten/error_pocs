import {client, Deploy, Faucet, exists, upgradePackage} from './utils.js';
import {promises as fs} from 'fs';

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
        'UnknownUpgradePolicy': UnknownUpgradePolicyTest,
        'PackageIDDoesNotMatch':  PackageIDDoesNotMatchTest,
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

function UnknownUpgradePolicyTest() {

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

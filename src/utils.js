
import { execSync } from 'node:child_process';
import tmp from 'tmp';
import { fromB64 } from '@mysten/sui/utils';
import { Ed25519Keypair, Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { Transaction, UpgradePolicy } from '@mysten/sui/transactions';
import { requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
import * as fs from 'fs/promises';

const rpcUrl = 'http://localhost:9000';
const faucetUrl = 'http://localhost:9123';

let keypair_str = 'AOn1BfySfunOZvWk4WpsmT9h2SzP4okPW69xkPQ7FWuN';
let secretKey = fromB64(keypair_str);

export const keypair = Ed25519Keypair.fromSecretKey(secretKey.slice(1));
export const address = keypair.getPublicKey().toSuiAddress();

// create a client connected to devnet
export const client = new SuiClient({ url: rpcUrl });

export async function Faucet() {
    await requestSuiFromFaucetV0({ host: faucetUrl, recipient: address })
}

export async function Deploy(moveProject) {
    const { packageId, publishTxn, buildDigest, modules, dependencies } = await publishPackage(moveProject);
    const updateCap = publishTxn.effects?.created.filter(
        (o) =>
            typeof o.owner === 'object' &&
            'AddressOwner' in o.owner,
    )[0];
    return { publishTxn, packageId, updateCap: updateCap.reference.objectId, buildDigest, modules, dependencies };
}

export async function publishPackage(moveProject) {
    const { modules, dependencies, digest: buildDigest } = await buildPackage(moveProject);

    const tx = new Transaction();
    const cap = tx.publish({
        modules,
        dependencies,
    });

    // Transfer the upgrade capability to the sender so they can upgrade the package later if they want.
    tx.transferObjects([cap], tx.pure.address(address));

    const { digest: tx_digest } = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
    });
    console.log('executed transaction', tx_digest);

    const publishTxn = await client.waitForTransaction({
        digest: tx_digest,
        options: { showObjectChanges: true, showEffects: true },
    });

    if (publishTxn.effects?.status.status != 'success') {
        throw new Error('unable to publish');
    }

    const packageId = ((publishTxn.objectChanges?.filter(
        (a) => a.type === 'published',
    ))[0]?.packageId.replace(/^(0x)(0+)/, '0x'));

    if (typeof packageId != 'string') {
        console.log('bad package id type');
    }

    console.info(`Published package ${packageId} from address ${address}}`);

    return { packageId, publishTxn, buildDigest, modules, dependencies };
}

export async function buildPackage(moveProject) {
    const tmpobj = tmp.dirSync({ unsafeCleanup: true });
    return JSON.parse(
        execSync(
            `cd ${moveProject} && sui move build --dump-bytecode-as-base64 --install-dir ${tmpobj.name}`,
            { encoding: 'utf-8' },
        )
    );
}

export async function upgradePackageCLI(moveProject, upgradeCap) {
    console.log('upgrading with cap', upgradeCap);
    try {
        execSync(`cd ${moveProject} && sui client upgrade --upgrade-capability ${upgradeCap} --skip-dependency-verification --dry-run`,
            {stdio: 'inherit'});
    } catch(e) {
        console.log('upgrade command exited nonzero');
    }
}


export async function upgradePackage(
    packageId,
    capId,
    moveProject,
) {
    const { modules, dependencies, digest } = buildPackage(moveProject);

    const tx = new Transaction();

    const cap = tx.object(capId);
    const ticket = tx.moveCall({
        target: '0x2::package::authorize_upgrade',
        arguments: [cap, tx.pure.u8(UpgradePolicy.COMPATIBLE), tx.pure.vector('u8', digest)],
    });

    const receipt = tx.upgrade({
        modules,
        dependencies,
        package: packageId,
        ticket,
    });

    tx.moveCall({
        target: '0x2::package::commit_upgrade',
        arguments: [cap, receipt],
    });

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });

    expect(result.effects?.status.status).toEqual('success');
}

export async function changeUpgradePolicy(cap, policy) {
    let target = ''
    if (policy === 'only_additive_upgrades') {
        target = '0x2::package::only_additive_upgrades';
    } else if (policy === 'only_dep_upgrades') {
        target = '0x2::package::only_dep_upgrades';
    } else if (policy === 'make_immutable') {
        target = '0x2::package::make_immutable';
    } else {
        throw new Error('invalid policy');
    }

    const tx = new Transaction();
    tx.moveCall({
        target,
        arguments: [tx.object(cap)],
    });

    return await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
            showEffects: true,
            showObjectChanges: true,
        },
    });
}


export async function exists(path) {
    try {
        await fs.access(path);
        return true;
    } catch (e) {
        console.log(e)
        return false;
    }
}
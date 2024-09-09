
import { execSync } from 'node:child_process';
import tmp from 'tmp';
import { fromB64 } from '@mysten/sui/utils';
import { Ed25519Keypair, Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { requestSuiFromFaucetV0 } from "@mysten/sui/faucet";

const rpcUrl = 'http://localhost:9000';
const faucetUrl = 'http://localhost:9123';

let keypair_str = 'AOn1BfySfunOZvWk4WpsmT9h2SzP4okPW69xkPQ7FWuN';
let secretKey = fromB64(keypair_str);
export const keypair = Ed25519Keypair.fromSecretKey(secretKey.slice(1));
const getAddress = async () => await keypair.getPublicKey().toSuiAddress();
let address = await getAddress();

// create a client connected to devnet
export const client = new SuiClient({ url: rpcUrl });

export async function Faucet() {
    await requestSuiFromFaucetV0({ host: faucetUrl, recipient: address })
}

export async function Deploy(moveProject) {
    const { packageId, publishTxn } = await publishPackage(moveProject);
    const updateCap = publishTxn.effects?.created.filter(
        (o) =>
            typeof o.owner === 'object' &&
            'AddressOwner' in o.owner,
    )[0];
    return { publishTxn, packageId, updateCap: updateCap.reference.objectId };
}

export async function publishPackage(moveProject) {
    const tmpobj = tmp.dirSync({ unsafeCleanup: true });

    const { modules, dependencies } = JSON.parse(
        execSync(
            `cd ${moveProject} && sui move build --dump-bytecode-as-base64 --install-dir ${tmpobj.name}`,
            { encoding: 'utf-8' },
        ),
    );
    const tx = new Transaction();
    const cap = tx.publish({
        modules,
        dependencies,
    });

    // Transfer the upgrade capability to the sender so they can upgrade the package later if they want.
    tx.transferObjects([cap], tx.pure.address(address));

    const { digest } = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
    });

    const publishTxn = await client.waitForTransaction({
        digest: digest,
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

    return { packageId, publishTxn };
}


export async function upgradePackage(moveProject, upgradeCap) {

    console.log('upgrading', upgradeCap);
    execSync(`cd ${moveProject} && sui client upgrade --upgrade-capability ${upgradeCap} --skip-dependency-verification`,
        { stdio: 'inherit' });
}
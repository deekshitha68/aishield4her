'use-strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
const channelName = 'mychannel';
const chaincodeName = 'aishield4her';
const mspId = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

// Path to the connection profile, now in the backend root
const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');

async function getCCP() {
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
    return ccp;
}

// --- HELPER FUNCTIONS ---

async function getGateway() {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const ccp = await getCCP();

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

async function ensureUserExists() {
    try {
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        let userIdentity = await wallet.get('appUser');
        if (userIdentity) {
            console.log('An identity for the user "appUser" already exists in the wallet');
            return;
        }

        console.log('"appUser" not found, enrolling new user...');
        const ccp = await getCCP();
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        let adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
            const x509Identity = {
                credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
            await wallet.put('admin', x509Identity);
        }

        adminIdentity = await wallet.get('admin');
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'appUser',
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({ enrollmentID: 'appUser', enrollmentSecret: secret });
        const x509Identity = {
            credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('appUser', x509Identity);
        console.log('Successfully registered and enrolled user "appUser"');

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

// --- EXPORTED FUNCTIONS ---

async function submitTransaction(functionName, ...args) {
    await ensureUserExists();
    const gateway = await getGateway();
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    const result = await contract.submitTransaction(functionName, ...args);
    gateway.disconnect();
    return result;
}

async function evaluateTransaction(functionName, ...args) {
    await ensureUserExists();
    const gateway = await getGateway();
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    const result = await contract.evaluateTransaction(functionName, ...args);
    gateway.disconnect();
    return result;
}

module.exports = { submitTransaction, evaluateTransaction };
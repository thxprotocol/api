const IDefaultDiamond = require('@thxnetwork/artifacts/artifacts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json');
const Web3 = require('web3');

function getProvider(rpc) {
    const web3 = new Web3(rpc);
    const admin = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.defaultAccount = admin.address;
    return { web3, admin };
}
const networks = [getProvider(process.env.TESTNET_RPC), getProvider(process.env.RPC)];

module.exports = {
    async up(db) {
        const assetpoolsColl = db.collection('assetpools');
        for (const pool of await assetpoolsColl.find().toArray()) {
            const { web3, admin } = networks[pool.network];
            const contract = new web3.eth.Contract(IDefaultDiamond.abi, pool.address);
            const latestAdminNonce = Number(
                await contract.methods.getLatestNonce(admin.address).call({ from: admin.address }),
            );

            await assetpoolsColl.updateOne({ _id: pool._id }, { $set: { latestAdminNonce } });
        }
    },

    async down(db) {
        await db.collection('assetpools').updateMany({}, { $unset: { latestAdminNonce: null } });
    },
};

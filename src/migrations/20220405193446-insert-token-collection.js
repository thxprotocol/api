const TokenFacetArtifact = require('@thxnetwork/artifacts/dist/exports/abis/Token.json');
const ERC20Artifact = require('@thxnetwork/artifacts/dist/exports/abis/ERC20.json');
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
        const erc20Coll = db.collection('erc20');

        for (const pool of await assetpoolsColl.find().toArray()) {
            try {
                const { web3, admin } = networks[pool.network];
                const contract = new web3.eth.Contract(TokenFacetArtifact, pool.address);
                const tokenAddress = await contract.methods.getToken().call({ from: admin.address });
                const tokenContract = new web3.eth.Contract(ERC20Artifact, tokenAddress);

                await erc20Coll.insertOne({
                    name: await tokenContract.methods.name().call(),
                    symbol: await tokenContract.methods.symbol().call(),
                    address: tokenAddress,
                    type: -1,
                    network: pool.network,
                    sub: pool.sub,
                    createdAt: pool.createdAt,
                    updatedAt: pool.updatedAt,
                });
            } catch (error) {
                console.log(error);
            }
        }
    },

    async down(db) {
        await db.collection('erc20').deleteMany({});
    },
};
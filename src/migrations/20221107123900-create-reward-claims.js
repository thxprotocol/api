const TokenFacetArtifact = require('@thxnetwork/artifacts/dist/exports/abis/ERC20Facet.json');
const Web3 = require('web3');
const { ObjectId } = require('mongodb');

const hardhat = new Web3(process.env.HARDHAT_RPC);
const hardhatAdmin = hardhat.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
hardhat.eth.defaultAccount = hardhatAdmin.address;

const testnet = new Web3(process.env.POLYGON_MUMBAI_RPC);
const testnetAdmin = testnet.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
testnet.eth.defaultAccount = testnetAdmin.address;

const mainnet = new Web3(process.env.POLYGON_RPC);
const mainnetAdmin = mainnet.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
mainnet.eth.defaultAccount = mainnetAdmin.address;

const ChainId = {
    Hardhat: 31337,
    PolygonMumbai: 80001,
    Polygon: 137,
};

const getProvider = (chainId) => {
    switch (chainId) {
        default:
        case ChainId.Hardhat:
            return { web3: hardhat, admin: hardhatAdmin };
        case ChainId.PolygonMumbai:
            return { web3: testnet, admin: testnetAdmin };
        case ChainId.Polygon:
            return { web3: mainnet, admin: mainnetAdmin };
    }
};
module.exports = {
    async up(db) {
        const rewardsColl = db.collection('rewards');
        const erc20tokenColl = db.collection('erc20token');
        const claimsColl = db.collection('claims');
        const assetPoolColl = db.collection('assetpools');

        const rewards = await rewardsColl.find({ claimId: { $eq: null } }).toArray();

        if (rewards.length == 0) {
            return;
        }
        const promises = rewards.map(async (reward) => {
            try {
                const assetPool = await assetPoolColl.findOne({ _id: new ObjectId(reward.poolId) });

                const { web3, admin } = getProvider(assetPool.chainId);

                const poolContract = new web3.eth.Contract(TokenFacetArtifact, assetPool.address);

                const tokenAddress = await poolContract.methods.getERC20().call();

                const erc20 = await erc20tokenColl.findOne({ address: tokenAddress, chainId: assetPool.chainId });
                let erc721;
                if (reward.erc721metadataId) {
                    const metadata = db.collection('erc721metadata').findById(reward.erc721metadataId);
                    erc721 = metadata ? db.collection('erc721').findById(metadata.erc721) : null;
                }

                // CLAIM CREATION
                const claim = await claimsColl.insertOne({
                    poolId: assetPool._id,
                    erc20Id: erc20 ? erc20.id : null,
                    erc721Id: erc721 ? erc721.id : null,
                    rewardId: reward.id,
                });

                // HASH CREATION
                const hashInfo = {
                    chainId: assetPool.chainId,
                    poolAddress: assetPool.address,
                    tokenSymbol: erc20 ? erc20.symbol : erc721.symbol,
                    rewardId: reward.id,
                    rewardAmount: reward.withdrawAmount,
                    rewardCondition: reward.withdrawCondition,
                    clientId: assetPool.clientId,
                };
                const hash = btoa(btoa(JSON.stringify(hashInfo)));

                // UPDATE REWARD
                await rewardsColl.updateOne(
                    { _id: reward._id },
                    {
                        $set: {
                            claimId: String(claim._id),
                            hash,
                        },
                    },
                );
            } catch (error) {
                console.log(error);
            }
        });

        await Promise.all(promises);
    },

    async down(db) {},
};

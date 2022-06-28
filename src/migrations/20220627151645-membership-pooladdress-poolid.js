module.exports = {
    async up(db) {
        const membershipsColl = db.collection('membership');
        const poolsColl = db.collection('assetpools');
        const memberships = await membershipsColl.find().toArray();

        await membershipsColl.updateMany({}, { $rename: { erc20: 'erc20Id', erc721: 'erc721Id' } });

        const promises = memberships.map(async (membership) => {
            try {
                const pool = await poolsColl.findOne({
                    address: membership.poolAddress,
                    chainId: membership.chainId,
                });
                if (pool) {
                    await membershipsColl.updateOne({ _id: membership._id }, { $set: { poolId: String(pool._id) } });
                }
            } catch (error) {
                console.log(error);
            }
        });

        await Promise.all(promises);
    },

    async down() {
        //
    },
};

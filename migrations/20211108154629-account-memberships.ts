module.exports = {
    async up(db: any) {
        const accountsColl = db.collection('accounts');
        const assetpoolsColl = db.collection('assetpools');
        const membershipsColl = db.collection('memberships');

        await (await accountsColl.find()).forEach(async (account: any) => {
            const sub = account._id.toString();
            if (account.memberships) {
                for (const poolAddress of account.memberships) {
                    const pool = await assetpoolsColl.findOne({ address: poolAddress });
                    await membershipsColl.insertOne({
                        network: pool.network,
                        sub,
                        poolAddress,
                    });
                }
            }
        });

        await accountsColl.updateMany({}, { $unset: { memberships: '' } });
    },

    async down(db: any) {
        const accountsColl = db.collection('accounts');
        const membershipsColl = db.collection('memberships');

        await membershipsColl.find().forEach(async (membership: any) => {
            const account = await accountsColl.find({ _id: membership.sub });

            account.memberships = account.memberships
                ? account.memberships.push(membership.poolAddress)
                : [membership.poolAddress];

            await accountsColl.updateOne({}, { $set: { memberships: account.memberships } });
        });

        await membershipsColl.deleteMany({});
    },
};

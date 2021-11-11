module.exports = {
    async up(db: any) {
        const clientColl = db.collection('client');
        const membershipColl = db.collection('membership');
        const ratColl = db.collection('registration_access_token');
        const assetpoolsColl = db.collection('assetpools');

        await (await assetpoolsColl.find()).forEach(async (pool: any) => {
            const rat = await ratColl.findOne({ _id: pool.rat });
            console.log('rat exists', rat?.payload.clientId);

            if (rat) {
                const membershipExists = await membershipColl.findOne({
                    network: pool.network,
                    sub: pool.sub,
                    poolAddress: pool.address,
                });

                console.log(pool.rat, 'membership exists', membershipExists);

                if (!membershipExists) {
                    await membershipColl.insertOne({
                        network: pool.network,
                        sub: pool.sub,
                        poolAddress: pool.address,
                    });
                }

                const clientExists = await clientColl.findOne({
                    sub: pool.sub,
                    clientId: rat.payload.clientId,
                    registrationAccessToken: rat.payload.jti,
                });

                console.log(pool.rat, 'client exists', clientExists);

                if (!clientExists) {
                    await clientColl.insertOne({
                        sub: pool.sub,
                        clientId: rat.payload.clientId,
                        registrationAccessToken: rat.payload.jti,
                    });
                }

                console.log(pool.rat, 'pool update', pool.address, pool.network, pool._id);

                await assetpoolsColl.updateOne(
                    { address: pool.address, network: pool.network },
                    { $unset: { rat: '' }, $set: { clientId: rat.payload.clientId } },
                );
            }
        });
        // await clientColl.deleteMany({});
    },

    async down() {
        //
    },
};

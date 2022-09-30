const { v4 } = require('uuid');

module.exports = {
    async up(db) {
        const claimsColl = db.collection('claims');
        const claims = await (await claimsColl.find({id: {$eq: null}})).toArray();

        console.log(
            'IDS TO MIGRATE:',
            claims.length,
            claims.map((x) => {
                return { _id: String(x._id), id: x.id };
            }),
        );

        const promises = (await claims).map(async (claim) => {
            try {
                const UUID = v4();
                await claimsColl.updateOne({ _id: claim._id }, { $set: { id: UUID } });
            } catch (error) {
                console.error(error);
            }
        });

        await Promise.all(promises);
    },
    async down() {
        //
    },
};

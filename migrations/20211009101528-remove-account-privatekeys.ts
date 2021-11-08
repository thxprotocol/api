module.exports = {
    async up(db: any) {
        await db.collection('accounts').updateMany({}, { $unset: { privateKeys: '' } });
    },

    async down(db: any) {
        await db.collection('accounts').updateMany({}, { $set: { privateKeys: '' } });
    },
};

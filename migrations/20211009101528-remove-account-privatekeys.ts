module.exports = {
    async up(db, client) {
        await db.collection('accounts').update({}, { $unset: { privateKeys: '' } });
    },

    async down(db, client) {
        await db.collection('accounts').update({}, { $set: { privateKeys: '' } });
    },
};

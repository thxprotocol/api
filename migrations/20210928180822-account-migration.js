module.exports = {
    async up(db) {
        return db.collection('accounts').updateMany({}, { $set: { recoveryPhrase: 'Test phrase' } });
    },
    async down(db) {
        return db.collection('accounts').updateMany({}, { $unset: { recoveryPhrase: null } });
    },
};

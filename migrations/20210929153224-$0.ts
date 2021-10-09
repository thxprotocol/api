import { Db } from 'mongodb';

export = {
    async up(db: Db) {
        return db.collection('accounts').updateMany({}, { $set: { recoveryPhrase: 'Test data' } });
    },

    async down(db: Db) {
        return db.collection('accounts').updateMany({}, { $unset: { recoveryPhrase: '' } });
    },
};

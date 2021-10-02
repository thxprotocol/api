import { Db } from 'mongodb';

export = {
    async up(db: Db) {
        return db.collection('withdrawals').updateMany({}, { $set: { rewardId: 0 } });
    },

    async down(db: Db) {
        return db.collection('withdrawals').updateMany({}, { $unset: { rewardId: '' } });
    },
};

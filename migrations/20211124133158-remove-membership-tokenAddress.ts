import { Db } from 'mongodb';

module.exports = {
    async up(db: Db) {
        await db.collection('membership').updateMany({}, { $unset: { tokenAddress: '' } });
    },
};

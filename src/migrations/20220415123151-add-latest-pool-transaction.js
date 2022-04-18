module.exports = {
    async up(db, client) {
        const assetpoolsColl = db.collection('assetpools');
        const transactionColl = db.collection('transactions');

        for (const pool of await assetpoolsColl.find().toArray()) {
            const transactions = await transactionColl
                .find({ to: pool.address })
                .sort({ createdAt: -1 })
                .limit(1)
                .toArray();
            const lastTransaction = transactions[0];
            if (!lastTransaction) continue;
            const lastTransactionTime = lastTransaction.createdAt;
            await assetpoolsColl.updateOne({ _id: pool._id }, { $set: { lastTransactionTime } });
        }

        // TODO write your migration here.
        // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
        // Example:
        // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    },

    async down(db, client) {
        // TODO write the statements to rollback your migration (if possible)
        // Example:
        // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    },
};

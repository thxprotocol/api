module.exports = {
    async up(db, client) {
        const withdrawalsColl = db.collection('withdrawals');
        const widgetsColl = db.collection('widgets');
        const rewardsColl = db.collection('rewards');

        rewardsColl.find({ id: { $type: 1 } }).forEach(function (r) {
            r.id = String(r.id);
            await rewardsColl.save(r);
        });

        withdrawalsColl.find({ rewardId: { $type: 1 } }).forEach(function (w) {
            w.rewardId = String(w.rewardId);
            await withdrawalsColl.save(w);
        });

        widgetsColl.find({ 'metadata.rewardId': { $type: 1 } }).forEach(function (w) {
            w.metadata.rewardId = String(w.rewardId);
            await widgetsColl.save(w);
        });
    },
};

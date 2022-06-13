module.exports = {
    async up(db) {
        const membershipsColl = db.collection('membership');
        const erc20tokenColl = db.collection('erc20token');
        const memberships = await membershipsColl.find().toArray();
        const promises = memberships.map(async (membership) => {
            try {
                const erc20token = await erc20tokenColl.findOne({ erc20Id: membership.erc20, sub: membership.sub });
                await membershipsColl.updateOne({ _id: membership._id }, { erc20: { $set: String(erc20token._id) } });
            } catch (error) {
                console.log(error);
            }
        });

        await Promise.all(promises);
    },

    async down(db) {},
};

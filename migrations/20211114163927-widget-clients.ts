import { Db } from 'mongodb';

module.exports = {
    async up(db: Db) {
        const clientColl = db.collection('client');
        const ratColl = db.collection('registration_access_token');
        const widgetColl = db.collection('widget');

        for (const widget of await widgetColl.find().toArray()) {
            const rat = await ratColl.findOne({ _id: widget.rat });

            if (rat) {
                const clientData = {
                    sub: widget.sub,
                    clientId: rat.payload.clientId,
                    registrationAccessToken: rat.payload.jti,
                };
                const client = await clientColl.findOne(clientData);

                if (!client) {
                    await clientColl.insertOne(clientData);
                }

                await widgetColl.updateOne(
                    { metadata: widget.metadata, sub: widget.sub },
                    { $unset: { rat: '' }, $set: { clientId: rat.payload.clientId } },
                );
            }
        }

        await clientColl.updateMany({}, { $unset: { registrationAccessTokens: '' } });
    },

    async down() {
        //
    },
};

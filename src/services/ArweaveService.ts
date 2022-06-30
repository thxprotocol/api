import { API_URL } from '@/config/secrets';
import arweave, { getArweaveKey, IS_TESTING, TEST_WAVE } from '@/util/arweave';

export default {
    upload: async (file: Express.Multer.File) => {
        const key = await getArweaveKey();
        const data = file.buffer;
        const payload = { data };
        const transaction = await arweave.createTransaction(payload, key);
        transaction.addTag('Content-Type', 'image/' + file.originalname.split('.')[1]);

        await arweave.transactions.sign(transaction, key);
        const status = await arweave.transactions.post(transaction);
        if (IS_TESTING) await TEST_WAVE.mine();

        if (status.status !== 200) throw new Error('Failed to upload to Arweave');
        return transaction;
    },

    getData: async (id: string) => {
        const info = await arweave.transactions.get(id);
        const data = await arweave.transactions.getData(id, { decode: true });
        return { info, data };
    },

    generateUrl: (id: string) => {
        return API_URL + '/arweave/' + id;
    },
};

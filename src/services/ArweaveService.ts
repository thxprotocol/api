import arweave, { getArweaveKey } from '@/util/arweave';

export default {
    send: async (data: Buffer | string) => {
        const transaction = await arweave.createTransaction(
            {
                data,
            },
            await getArweaveKey(),
        );
        return transaction;
    },
};

import arweave, { getArweaveKey, ARWEAVE_URL } from '@/util/arweave';
import { NotFoundError } from '@/util/errors';

async function upload(file: Express.Multer.File) {
    try {
        const key = await getArweaveKey();
        const data = file.buffer;
        const payload = { data };
        const transaction = await arweave.createTransaction(payload, key);
        transaction.addTag('Content-Type', file.mimetype);

        await arweave.transactions.sign(transaction, key);

        const uploader = await arweave.transactions.getUploader(transaction);

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
        }

        return transaction;
    } catch (err) {
        console.log('ERROR ON UPLOADING', err);
        throw new Error('Failed to upload to Arweave');
    }
}

async function getData(id: string) {
    const status = await arweave.transactions.getStatus(id);
    console.log('status', status);

    if (!status.confirmed) {
        throw new NotFoundError('the transaction is not confirmed yet');
    }

    const data = await arweave.transactions.getData(id, { decode: true });

    return data;
}

async function generateUrl(id: string) {
    return ARWEAVE_URL + '/' + id;
}

export default { upload, getData, generateUrl };

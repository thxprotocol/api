import { S3Client } from '@aws-sdk/client-s3';
import {
    AWS_ACCESS_KEY,
    AWS_BUCKET_REGION,
    AWS_S3_PRIVATE_ACCESS_KEY,
    AWS_S3_PRIVATE_BUCKET_REGION,
    AWS_S3_PRIVATE_SECRET_KEY,
    AWS_SECRET_KEY,
} from '@/config/secrets';

const s3PrivateClient = new S3Client({
    region: AWS_S3_PRIVATE_BUCKET_REGION,
    credentials: {
        accessKeyId: AWS_S3_PRIVATE_ACCESS_KEY,
        secretAccessKey: AWS_S3_PRIVATE_SECRET_KEY,
    },
});

const s3Client = s3PrivateClient; //new S3Client({
//     region: AWS_BUCKET_REGION,
//     credentials: {
//         accessKeyId: AWS_ACCESS_KEY,
//         secretAccessKey: AWS_SECRET_KEY,
//     },
// });

export { s3Client, s3PrivateClient };

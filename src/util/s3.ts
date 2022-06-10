import { S3Client } from '@aws-sdk/client-s3';
import { AWS_ACCESS_KEY, AWS_BUCKET_REGION, AWS_SECRET_KEY } from '@/config/secrets';

const s3Client = new S3Client({
    region: AWS_BUCKET_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
    },
});

export { s3Client };

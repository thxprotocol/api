import { NetworkProvider } from '@/types/enums';
import { ArtifactsKey } from '@/util/artifacts';

export type TContractEnvironmentConfig = {
    [key in NetworkProvider]: {
        version: string;
        assetPoolFactory: string;
        assetPoolRegistry: string;
        facets: {
            [key in ArtifactsKey]?: string;
        };
    }[];
};

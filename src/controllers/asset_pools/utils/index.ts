import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '@/util/network';
import { AssetPoolDocument } from '@/models/AssetPool';
import axios from 'axios';
import { Error } from 'mongoose';
import { parseEther } from 'ethers/lib/utils';
import { ISSUER } from '@/util/secrets';

export async function getTokenAddress(token: any, assetPool: AssetPoolDocument) {
    if (token.address) {
        const provider = getProvider(assetPool.network);
        const code = await provider.eth.getCode(token.address);

        if (code === '0x') {
            return new Error(`No data found at ERC20 address ${token.address}`);
        }

        return token.address;
    } else if (token.name && token.symbol && Number(token.totalSupply) > 0) {
        const tokenInstance = await deployLimitedSupplyERC20Contract(
            assetPool.network,
            token.name,
            token.symbol,
            assetPool.address,
            parseEther(token.totalSupply),
        );
        return tokenInstance.options.address;
    } else if (token.name && token.symbol && Number(token.totalSupply) === 0) {
        const tokenInstance = await deployUnlimitedSupplyERC20Contract(
            assetPool.network,
            token.name,
            token.symbol,
            assetPool.address,
        );

        return tokenInstance.options.address;
    }
}

export async function getRegistrationAccessToken() {
    try {
        const r = await axios({
            method: 'POST',
            url: ISSUER + '/reg',
            data: {
                application_type: 'web',
                grant_types: ['client_credentials'],
                request_uris: [],
                redirect_uris: [],
                post_logout_redirect_uris: [],
                response_types: [],
                scope: 'openid admin',
            },
        });

        return r.data.registration_access_token;
    } catch (e) {
        return {
            error: e.toString(),
        };
    }
}

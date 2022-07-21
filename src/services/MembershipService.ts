import { Membership } from '@/models/Membership';
import { getContractFromName } from '@/config/contracts';
import { ERC721Variant } from '@/types/enums/ERC721Variant';
import { ERC721 } from '@/models/ERC721';
import { AssetPoolDocument } from '@/models/AssetPool';
import { ERC20Token } from '@/models/ERC20Token';
import { ChainId } from '@/types/enums';
import ERC20Service from './ERC20Service';
import ERC721Service from './ERC721Service';

export default class MembershipService {
    static async findForSub(sub: string) {
        const memberships = await Membership.find({ sub });
        return memberships.map((m) => String(m._id));
    }

    static async hasMembership(assetPool: AssetPoolDocument, sub: string) {
        const membership = await Membership.findOne({
            sub,
            chainId: assetPool.chainId,
            poolId: String(assetPool._id),
        });

        return !!membership;
    }

    static async getById(id: string) {
        return await Membership.findById(id);
        // if (!membership) return null;
    }

    static async addERC20Membership(sub: string, assetPool: AssetPoolDocument) {
        const membership = await Membership.findOne({ sub, poolId: String(assetPool._id) });

        if (!membership) {
            const erc20 = await ERC20Service.findByPool(assetPool);
            let token = await ERC20Token.findOne({
                sub,
                erc20Id: String(erc20._id),
            });

            if (!token) {
                token = await ERC20Token.create({
                    sub,
                    erc20Id: String(erc20._id),
                });
            }

            await Membership.create({
                sub,
                chainId: assetPool.chainId,
                poolId: String(assetPool._id),
                erc20Id: String(token._id),
            });
        }
    }

    static async addERC721Membership(sub: string, assetPool: AssetPoolDocument) {
        const membership = await Membership.findOne({
            sub,
            chainId: assetPool.chainId,
            poolId: String(assetPool._id),
        });

        if (!membership) {
            const address = await assetPool.contract.methods.getERC721().call();
            let erc721 = await ERC721Service.findByQuery({ chainId: assetPool.chainId, address });

            if (!erc721) {
                const contract = getContractFromName(assetPool.chainId, 'NonFungibleToken', address);
                const [name, symbol] = await Promise.all([
                    contract.methods.name().call(),
                    contract.methods.symbol().call(),
                ]);

                erc721 = await ERC721.create({
                    name,
                    symbol,
                    address,
                    type: ERC721Variant.Unknown,
                    chainId: assetPool.chainId,
                });
            }

            await Membership.create({
                sub,
                chainId: assetPool.chainId,
                poolId: String(assetPool._id),
                erc721Id: String(erc721._id),
            });
        }
    }

    static async removeMembership(sub: string, assetPool: AssetPoolDocument) {
        await Membership.deleteOne({
            sub,
            chainId: assetPool.chainId,
            poolId: String(assetPool._id),
        });
    }

    static async remove(id: string): Promise<void> {
        const membership = await Membership.findById(id);

        await membership.remove();
    }

    static countByNetwork(chainId: ChainId) {
        return Membership.countDocuments({ chainId });
    }
}

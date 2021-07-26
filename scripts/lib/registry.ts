import { Artifacts } from '@/util/artifacts';
import { deployContract, NetworkProvider } from '@/util/network';
import { COLLECTOR } from '@/util/secrets';

export async function deployRegistry(npid: NetworkProvider) {
    const registry = await deployContract(
        Artifacts.PoolRegistry.abi,
        Artifacts.PoolRegistry.bytecode,
        [COLLECTOR, 0],
        npid,
    );

    return registry.options.address;
}

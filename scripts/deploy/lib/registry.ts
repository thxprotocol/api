import { Artifacts } from '../../../src/util/artifacts';
import { deployContract, NetworkProvider } from '../../../src/util/network';
import { COLLECTOR } from '../../../src/util/secrets';

export async function deployRegistry(npid: NetworkProvider) {
    const registry = await deployContract(
        Artifacts.PoolRegistry.abi,
        Artifacts.PoolRegistry.bytecode,
        [COLLECTOR, 0],
        npid,
    );

    return registry.options.address;
}

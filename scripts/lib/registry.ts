import { COLLECTOR } from '../../src/util/secrets';
import { deployContract, NetworkProvider } from '../../src/util/network';
import PoolRegistryArtifact from '../../src/artifacts/contracts/contracts/PoolRegistry.sol/PoolRegistry.json';

export const deployPoolRegistry = async (npid: NetworkProvider) => {
    const registry = await deployContract(
        PoolRegistryArtifact.abi,
        PoolRegistryArtifact.bytecode,
        [COLLECTOR, 0],
        npid,
    );

    return registry.options.address;
};

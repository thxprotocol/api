import { Contract } from 'web3-eth-contract';


export interface TransactionEntity {
    address: string;
    solutionMethods: Contract;
    network: number;
    id: string;
    memeber: any;
}

export interface TransactionLogEntity {
    logs: any;
}

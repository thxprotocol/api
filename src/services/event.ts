import { rewardPoolContract } from '../util/network';

export const rewardPoolEventListener = () => {
    // Get all pools addresses from mongodb
    // Subscribe for all events per contract instance
    // Log the event
    // Update mongo when metaData should change
    // rewardPoolContract('0x036BD58cdB0e48425765BB4DD56b0a55E12e1Acd')
    //     .events.Deposit(
    //         {
    //             fromBlock: 0,
    //         },
    //         function (err: any, event: any) {
    //             if (err) return console.error(err);
    //             console.log(event);
    //         },
    //     )
    //     .on('data', function (event: any) {
    //         console.log('data', event); // same results as the optional callback above
    //     })
    //     .on('changed', function (event: any) {
    //         console.log('changed', event);
    //     })
    //     .on('error', console.error);
};

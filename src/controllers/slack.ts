// 'use strict';

// import { Response, Request } from 'express';
// import Network, { RewardRule } from '../util/network';

// const network = new Network();

// /**
//  * GET /slack
//  * Home view for API.
//  */
// export const getSlack = (req: Request, res: Response) => {
//     res.send({
//         message: `THX Slack Proxy v0.1.0 (${process.env.NODE_ENV})`,
//     });
// };

// /**
//  * POST /slack/connect
//  * Connect Slack account to Reward Pool
//  */
// export const connectAccount = (req: Request, res: Response) => {
//     const query = req.body.text.split(' ');
//     res.send({
//         as_user: true,
//         attachments: [
//             {
//                 blocks: [
//                     {
//                         type: 'section',
//                         text: {
//                             type: 'mrkdwn',
//                             text: '*Connect your Slack account a Reward Pool!*',
//                         },
//                     },
//                     {
//                         type: 'section',
//                         text: {
//                             type: 'mrkdwn',
//                             text: `Scan this QR code with your THX wallet. \n Reward pool: *${query[0]}* \n Slack ID: *${req.body.user_id}*`,
//                         },
//                         accessory: {
//                             type: 'image',
//                             image_url: network.apiURL + `/qr/connect/${query[0]}/${req.body.user_id}`,
//                             alt_text: 'qr code for connecting your account to a pool',
//                         },
//                     },
//                 ],
//             },
//         ],
//     });
// };

// /**
//  * POST /slack/reward
//  * Send Reward address mapped to connected Slack account
//  */
// export const sendReward = async (req: Request, res: Response) => {
//     const query = req.body.text.split(' ');
//     const poolAddress = await network.getRewardPoolAddress(req.body.user_id);
//     const uid: any = await network.getUID(req.body.user_id);
//     const user: any = await network.getUser(uid, poolAddress);

//     network.rewardPool.options.address = poolAddress;

//     if (query[0].startsWith('<@')) {
//         const channel = query[0].split('@')[1].split('|')[0];
//         const id = query[1];
//         const rule = await network.getRewardRule(id, poolAddress);
//         const data = await network.pushReward(poolAddress, id);

//         res.send({
//             text: '*Your reward is sent!* :money_with_wings: Make sure your reward is claimed by the beneficiary.',
//         });

//         await network.setReward(poolAddress, id, data.name);
//         await network.proposeReward(channel, user, id, poolAddress, data.name, rule);
//     } else {
//         res.send({
//             text: 'Make sure to mention a pool member and provide the rule ID.',
//         });
//     }
// };

// /**
//  * POST /slack/rules
//  * List Reward Rules for connected Reward Pool
//  */
// export const getRewardRules = async (req: Request, res: Response) => {
//     const query = req.body.text.split(' ');
//     const poolAddress = await network.getRewardPoolAddress(req.body.user_id);

//     network.rewardPool.options.address = poolAddress;

//     if (query[0] === 'list') {
//         const poolName = await network.rewardPool.methods.name().call({ from: network.account });
//         const amountOfRules = parseInt(
//             await network.rewardPool.methods.countRules().call({ from: network.account }),
//             10,
//         );

//         if (amountOfRules > 0) {
//             let message = `*${poolName}* has ${amountOfRules} reward rules available: `;

//             for (let id = 0; id < amountOfRules; id++) {
//                 const rule: RewardRule = await network.getRewardRule(id, poolAddress);

//                 message +=
//                     '\n• `#' + id + '` *' + network.utils.fromWei(rule.amount, 'ether') + ' THX* - ' + rule.title;
//             }

//             res.send({
//                 text: message,
//             });
//         } else {
//             res.send({
//                 text: `*${poolName}* has 0 rules available.`,
//             });
//         }
//     } else if (query[0] && !isNaN(query[0])) {
//         const id = parseInt(query[0], 10);
//         const rule: RewardRule = await network.getRewardRule(id, poolAddress);

//         res.send({
//             text:
//                 '`#' +
//                 id +
//                 '` *' +
//                 network.utils.fromWei(rule.amount, 'ether') +
//                 ' THX* - ' +
//                 rule.title +
//                 ':\n _' +
//                 rule.description +
//                 '_',
//         });
//     } else {
//         res.send({
//             text: 'Send a query with your command. \n Example: `/rules list` or `/rules 0`',
//         });
//     }
// };

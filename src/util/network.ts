// import axios from 'axios';
// import { LocalAddress, CryptoUtils, LoomProvider, Client } from 'loom-js';
// import Web3 from 'web3';
// import fs from 'fs';

// export default class Network {
//     apiURL: string = process.env.API_URL;
//     appURL: string = process.env.APP_URL;
//     dbURL: string = process.env.DB_URL;
//     account: string;
//     rewardPool: any;
//     web3: any;
//     utils: any;

//     constructor() {
//         const abiFile = fs.readFileSync('./src/contracts/RewardPool.abi', 'utf8');
//         const rewardPoolABI = JSON.parse(abiFile);
//         const privateKeyArray = CryptoUtils.generatePrivateKey();
//         const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKeyArray);
//         const client: any = new Client(
//             process.env.EXTDEV_CHAIN_ID,
//             process.env.EXTDEV_SOCKET_URL,
//             process.env.EXTDEV_QUERY_URL,
//         );
//         const provider: any = new LoomProvider(client, privateKeyArray);

//         this.web3 = new Web3(provider);
//         this.account = LocalAddress.fromPublicKey(publicKey).toString();
//         this.utils = new Web3().utils;
//         this.rewardPool = new this.web3.eth.Contract(rewardPoolABI);
//     }

//     getQRBuffer(qrBase64: string) {
//         const regex = /^data:.+\/(.+);base64,(.*)$/;
//         const match = qrBase64.match(regex);

//         if (match && match[2]) {
//             return Buffer.from(match[2], 'base64');
//         } else {
//             return;
//         }
//     }

//     async countRules(poolAddress: string) {
//         this.rewardPool.options.address = poolAddress;

//         try {
//             const count = await this.rewardPool.methods.countRules().call({ from: this.account });

//             return parseInt(count, 10);
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async getRewardPoolAddress(id: string) {
//         try {
//             const r = await axios({
//                 method: 'GET',
//                 url: `${this.dbURL}/slack/${id}/rewardPool.json`,
//             });

//             return r.data;
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async getUID(id: string) {
//         try {
//             const r = await axios({
//                 method: 'GET',
//                 url: `${this.dbURL}/slack/${id}/uid.json`,
//             });

//             return r.data;
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async getMember(id: number, poolAddress: string) {
//         this.rewardPool.options.address = poolAddress;

//         try {
//             const address = await this.rewardPool.methods.members(id).call({ from: this.account });
//             const r = await axios({
//                 method: 'GET',
//                 url: `${this.dbURL}/wallets/${address.toLowerCase()}.json`,
//             });
//             const u = await axios({
//                 method: 'GET',
//                 url: `${this.dbURL}/users/${r.data.uid}.json`,
//             });

//             return {
//                 id,
//                 address,
//                 uid: r.data.uid,
//                 email: u.data.email,
//                 firstName: u.data.firstName,
//                 lastName: u.data.lastName,
//                 picture: u.data.picture && u.data.picture.url,
//             };
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async getUser(uid: string, poolAddress: string) {
//         this.rewardPool.options.address = poolAddress;

//         try {
//             const r = await axios({
//                 method: 'GET',
//                 url: `${this.dbURL}/users/${uid}.json`,
//             });

//             return r.data;
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async pushReward(poolAddress: string, id: number) {
//         try {
//             const r = await axios({
//                 method: 'POST',
//                 url: `${this.dbURL}/pools/${poolAddress}/rewards.json`,
//                 data: JSON.stringify({
//                     pool: poolAddress,
//                     rule: id,
//                 }),
//             });

//             return r.data;
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async getRewardRule(id: number, poolAddress: string) {
//         this.rewardPool.options.address = poolAddress;

//         try {
//             const rule = await this.rewardPool.methods.rules(id).call({ from: this.account });
//             const meta = await axios({
//                 method: 'GET',
//                 url: `${this.dbURL}/pools/${poolAddress}/rules/${id}.json`,
//             });

//             return new RewardRule(rule, meta.data);
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async setReward(poolAddress: string, id: number, key: string) {
//         try {
//             const r = await axios({
//                 method: 'POST',
//                 url: `${this.dbURL}/pools/${poolAddress}/rewards/${key}.json`,
//                 data: JSON.stringify({
//                     pool: poolAddress,
//                     rule: id,
//                     key: key,
//                 }),
//             });

//             return r;
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async createReward(poolAddress: string, rule: string, address: string) {
//         this.rewardPool.options.address = poolAddress;

//         try {
//             const tx = await this.rewardPool.methods.createReward(rule, address).send({ from: this.account });

//             return tx;
//         } catch (e) {
//             console.error(e);
//         }
//     }

//     async proposeReward(channel: string, member: any, id: any, poolAddress: string, key: string, rule: RewardRule) {
//         try {
//             const payload: any = {
//                 as_user: true,
//                 channel,
//                 text: `*Congratulations!:moneybag: ${member.firstName} ${
//                     member.lastName
//                 }* has rewarded you *${this.utils.fromWei(rule.amount, 'ether')} THX* for reward rule *${rule.title}*`,
//                 attachments: [
//                     {
//                         blocks: [
//                             {
//                                 type: 'section',
//                                 text: {
//                                     type: 'mrkdwn',
//                                     text:
//                                         "Scan the QR code with your THX wallet and claim this reward. \n You don't have a wallet? No harm done, register a fresh one!",
//                                 },
//                                 accessory: {
//                                     type: 'image',
//                                     image_url: `${this.apiURL}/qr/reward/${poolAddress}/${id}/${key}`,
//                                     alt_text: 'qr code for reward verification',
//                                 },
//                             },
//                             {
//                                 type: 'actions',
//                                 elements: [
//                                     {
//                                         type: 'button',
//                                         url: `${this.appURL}/register`,
//                                         text: {
//                                             type: 'plain_text',
//                                             text: 'Register Wallet',
//                                         },
//                                         style: 'primary',
//                                     },
//                                     {
//                                         type: 'button',
//                                         url: 'https://www.thxprotocol.com/',
//                                         text: {
//                                             type: 'plain_text',
//                                             text: 'More info',
//                                         },
//                                     },
//                                 ],
//                             },
//                         ],
//                     },
//                 ],
//             };

//             const r = await axios({
//                 method: 'POST',
//                 url: 'https://slack.com/api/chat.postMessage',
//                 headers: {
//                     'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
//                     'Content-Type': 'application/json;charset=utf-8',
//                 },
//                 data: JSON.stringify(payload),
//             }).catch((e) => console.error);

//             return r;
//         } catch (e) {
//             console.error(e);
//         }
//     }
// }

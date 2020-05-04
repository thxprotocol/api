"use strict";

const RewardPoolABI = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"address","name":"_tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"ManagerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"ManagerRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"MemberAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"MemberRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"reward","type":"address"}],"name":"RewardPollCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"reward","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"RewardPollFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"proposedAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"RulePollCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"RulePollFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"enum RewardPool.RuleState","name":"state","type":"uint8"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"RuleStateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beneficiary","type":"address"},{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[],"name":"MAX_VOTED_TOKEN_PERC","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"RULE_POLL_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"countDeposits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"countRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"beneficiary","type":"address"}],"name":"countRewardsOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"countRules","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"countWithdrawels","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"rule","type":"uint256"},{"internalType":"address","name":"account","type":"address"}],"name":"createReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"createRule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"creator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"deposits","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"created","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isManager","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isMember","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"managers","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"members","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minVotedTokensPerc","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"}],"name":"onRewardPollFinish","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"},{"internalType":"uint256","name":"proposedAmount","type":"uint256"}],"name":"onRulePollFinish","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"created","type":"uint256"}],"name":"onWithdrawel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"revokeVoteForReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"revokeVoteForRule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rewards","outputs":[{"internalType":"contract Reward","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"rewardsOf","outputs":[{"internalType":"contract Reward","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rules","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"enum RewardPool.RuleState","name":"state","type":"uint8"},{"internalType":"contract RulePoll","name":"poll","type":"address"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"created","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"proposedAmount","type":"uint256"}],"name":"startRulePoll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract THXToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"value","type":"string"}],"name":"updatePoolName","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"}],"name":"voteForReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"}],"name":"voteForRule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"withdrawels","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"created","type":"uint256"}],"stateMutability":"view","type":"function"}];

import { Response, Request, NextFunction } from "express";
import axios from 'axios';
import { LocalAddress, CryptoUtils, LoomProvider, Client } from 'loom-js';

const API_ROOT = 'https://us-central1-thx-wallet-dev.cloudfunctions.net/api';
const APP_ROOT = 'https://thx-wallet-dev.firebaseapp.com';
const EXTDEV_CHAIN_ID = 'extdev-plasma-us1';
const PRIVATE_KEY_ARRAY = CryptoUtils.generatePrivateKey();
const PUBLIC_KEY = CryptoUtils.publicKeyFromPrivateKey(PRIVATE_KEY_ARRAY);
const API_ADDRESS = LocalAddress.fromPublicKey(PUBLIC_KEY).toString();
const client: any = new Client(
    EXTDEV_CHAIN_ID,
    'wss://extdev-plasma-us1.dappchains.com/websocket',
    'wss://extdev-plasma-us1.dappchains.com/queryws',
);
const Web3 = require('web3');
const provider = new LoomProvider(client, PRIVATE_KEY_ARRAY);
const web3 = new Web3(provider);
const utils = new Web3().utils;

function sendMessage(url: string, message: any) {
    return axios({
            method: 'POST',
            url,
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            data: JSON.stringify(message),
        })
        .catch((e: any) => {
            console.error('sendMessage', e);
        });
};

async function RewardRule(id: number, poolAddress: string) {
    const r: any = getRewardRule(id, poolAddress);
    
    return (r)
        ? {
            id,
            title: r.title,
            description: r.description,
            amount: 0,
        }
        : null;
}

async function getRewardRuleBlocks(length: number, poolContract: any) {
    const blocks: string[] = [];

    for (let id = 0; id < length; id++) {
        const rule = await RewardRule(id, poolContract.options.address);
        const r = await poolContract.methods.rules(id).call({ from: API_ADDRESS });

        if (rule) {
            blocks.push('\n• `#' + rule.id + '` *' + utils.fromWei(r.amount, 'ether') + ' THX* - ' + rule.title);
        }
    }
    return blocks;
}

async function getRewardRule(id: number, poolAddress: string) {
    const r = await axios({
        method: 'GET',
        url: `https://thx-client.firebaseio.com/pools/${poolAddress}/rules/${id}.json`,
    });
    
    return r.data;
}

async function getRewardPoolAddress(id: string) {
    const r = await axios({
        method: 'GET',
        url: `https://thx-client.firebaseio.com/slack/${id}/rewardPool.json`,
    });
    
    return r.data;
}

async function getUID(id: string) {
    const r = await axios({
        method: 'GET',
        url: `https://thx-client.firebaseio.com/slack/${id}/uid.json`,
    });
    
    return r.data;
}

async function getMember(uid: string) {
    const r = await axios({
        method: 'GET',
        url: `https://thx-client.firebaseio.com/users/${uid}.json`,
    });
    
    return r.data;
}

/**
 * GET /slack/connect
 * Connect Slack account to Reward Pool
 */
 export const connectAccount = (req: any, res: any) => {
     const query = req.body.text.split(' ');
     
     res.send({
         as_user: true,
         attachments: [
             {
                 blocks: [
                     {
                         type: 'section',
                         text: {
                             type: 'mrkdwn',
                             text: `*Connect your Slack account a Reward Pool!*`,
                         },
                     },
                     {
                         type: 'section',
                         text: {
                             type: 'mrkdwn',
                             text: `Scan this QR code with your THX wallet. \n Reward pool: *${query[0]}* \n Slack ID: *${req.body.user_id}*`,
                         },
                         accessory: {
                             type: 'image',
                             image_url: API_ROOT + `/qr/connect/${query[0]}/${req.body.user_id}`,
                             alt_text: 'qr code for connecting your account to a pool',
                         },
                     },
                 ],
             },
         ],
     });
};

/**
* POST /slack/reward
* Send Reward address mapped to connected Slack account
*/
export const sendReward = async (req: any, res: any) => {
    const message = { 
        response_type: "ephemeral",
        text: ":hourglass_flowing_sand: Working on it..."
    };
    
    res.status(200).send(message);
    
    const query = req.body.text.split(' ');
    console.log(req.body.user_id);
    const poolAddress = await getRewardPoolAddress(req.body.user_id);
    console.log(poolAddress);
    const uid: any = await getUID(req.body.user_id);
    console.log(uid);
    
    const member: any = await getMember(uid);
    console.log(member);
    
    if (query[0].startsWith('<@')) {
        const channel = query[0].split('@')[1].split('|')[0];
        const rule = query[1];
        
        const r: any = await axios({
            method: 'POST',
            url: `https://thx-client.firebaseio.com/pools/${poolAddress}/rewards.json`,
        });
        console.log(r);
            
        await axios({
            method: 'POST',
            url: `https://thx-client.firebaseio.com/pools/${poolAddress}/rewards/${r.name}.json`,
            data: JSON.stringify({
                pool: poolAddress,
                rule: rule,
                key: r.name,
            }),
        })
            
        // await admin.database().ref(`/pools/${poolAddress}/rewards/${snap.key}`).set({
        //     pool: poolAddress,
        //     rule: rule,
        //     key: snap.key,
        // });
        
        const message = {
            as_user: true,
            channel,
            text: "Congratulations! You have received a reward. :moneybag:",
            attachments: [
                {
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: "Scan the QR code with your THX wallet and claim this reward. \n You don't have a wallet? No harm done, register a fresh one!",
                            },
                            accessory: {
                                type: 'image',
                                image_url: API_ROOT + `/qr/claim/${poolAddress}/${rule}/${r.name}`,
                                alt_text: 'qr code for reward verification',
                            },
                        },
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    url: `${APP_ROOT}/register`,
                                    text: {
                                        type: 'plain_text',
                                        text: 'Register Wallet',
                                    },
                                },
                                {
                                    type: 'button',
                                    url: `${APP_ROOT}/claim/${poolAddress}/${rule}`,
                                    text: {
                                        type: 'plain_text',
                                        text: 'Claim on this device',
                                    },
                                    style: 'primary',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        axios({
                method: 'POST',
                url: 'https://slack.com/api/chat.postMessage',
                headers: {
                    'Authorization': 'Bearer xoxb-874849905696-951441147569-jiqzfWErHKgPlDvBNzE40Jwh',
                    'Content-Type': 'application/json;charset=utf-8',
                },
                data: JSON.stringify(message),
            })
            .then(() => {
                const message = { 
                    replace_original: true,
                    text: `Your reward is sent to *${member.firstName} ${member.lastName}* :money_with_wings: Make sure your reward is claimed!`,
                };
                sendMessage(req.body.response_url, message);
            })
            .catch((e: string) => {
                console.error(e);
            });
    } else {
        const message = { 
            replace_original: true,
            text: 'Make sure to mention a pool member.',
        };
        sendMessage(req.body.response_url, message);
    }
};


/**
* GET /slack/rules
* List Reward Rules for connected Reward Pool
*/
export const getRewardRules = async (req: any, res: any) => {
    const query = req.body.text.split(' ');
    
    if (query[0] === 'list') {
        const poolAddress = await getRewardPoolAddress(req.body.user_id);
        const poolContract = new web3.eth.Contract(RewardPoolABI, poolAddress);
        const length = parseInt(await poolContract.methods.countRules().call({ from: API_ADDRESS }), 10);
        const poolName = await poolContract.methods.name().call({ from: API_ADDRESS });

        if (length > 0) {
            const blocks: string[] = await getRewardRuleBlocks(length, poolContract);
            const message = {
                replace_original: true,
                text: `*${poolName}* has ${blocks.length} reward rules available: `,
            };
            for (const b of blocks) {
                message.text += b;
            }

            sendMessage(req.body.response_url, message);
        } else {
            const message = {
                replace_original: true,
                text: `Pool *${poolName}* has no rules available.`,
            };

            sendMessage(req.body.response_url, message);
        }
    } else {
        const message = {
            replace_original: true,
            text: 'Send a query with your command. \n Example: `/rules list`',
        };
        sendMessage(req.body.response_url, message);
    }
};
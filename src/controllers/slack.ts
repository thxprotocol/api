"use strict";

import { Response, Request, NextFunction } from "express";
import axios from "axios";
import { LocalAddress, CryptoUtils, LoomProvider, Client } from "loom-js";

const RewardPoolABI = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"address","name":"_tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"ManagerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"ManagerRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"MemberAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"}],"name":"MemberRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"reward","type":"address"}],"name":"RewardPollCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"reward","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"RewardPollFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"proposedAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"RulePollCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"RulePollFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"enum RewardPool.RuleState","name":"state","type":"uint8"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"RuleStateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beneficiary","type":"address"},{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[],"name":"MAX_VOTED_TOKEN_PERC","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"RULE_POLL_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"countDeposits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"countRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"beneficiary","type":"address"}],"name":"countRewardsOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"countRules","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"countWithdrawels","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"rule","type":"uint256"},{"internalType":"address","name":"account","type":"address"}],"name":"createReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"createRule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"creator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"deposits","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"created","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isManager","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isMember","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"managers","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"members","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minVotedTokensPerc","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"}],"name":"onRewardPollFinish","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"},{"internalType":"uint256","name":"proposedAmount","type":"uint256"}],"name":"onRulePollFinish","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"created","type":"uint256"}],"name":"onWithdrawel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceMember","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"revokeVoteForReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"revokeVoteForRule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rewards","outputs":[{"internalType":"contract Reward","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"rewardsOf","outputs":[{"internalType":"contract Reward","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rules","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"enum RewardPool.RuleState","name":"state","type":"uint8"},{"internalType":"contract RulePoll","name":"poll","type":"address"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"created","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"proposedAmount","type":"uint256"}],"name":"startRulePoll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract THXToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"value","type":"string"}],"name":"updatePoolName","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"}],"name":"voteForReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bool","name":"agree","type":"bool"}],"name":"voteForRule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"withdrawels","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"created","type":"uint256"}],"stateMutability":"view","type":"function"}];
const API_ROOT = "https://us-central1-thx-wallet-dev.cloudfunctions.net/api";
const APP_ROOT = "https://thx-wallet-dev.firebaseapp.com";
const DB_ROOT = "https://thx-wallet-dev.firebaseio.com";
const EXTDEV_CHAIN_ID = "extdev-plasma-us1";
const PRIVATE_KEY_ARRAY = CryptoUtils.generatePrivateKey();
const PUBLIC_KEY = CryptoUtils.publicKeyFromPrivateKey(PRIVATE_KEY_ARRAY);
const API_ADDRESS = LocalAddress.fromPublicKey(PUBLIC_KEY).toString();
const Web3 = require("web3");
const client: any = new Client(
    EXTDEV_CHAIN_ID,
    "wss://extdev-plasma-us1.dappchains.com/websocket",
    "wss://extdev-plasma-us1.dappchains.com/queryws",
);
const provider = new LoomProvider(client, PRIVATE_KEY_ARRAY);
const web3 = new Web3(provider);
const utils = new Web3().utils;
const PoolContract = new web3.eth.Contract(RewardPoolABI);

async function getRewardRule(id: number, poolAddress: string) {
    console.log(new Date().getTime(), "Invoked getRewardRule");
    try {
        const r = await axios({
            method: "GET",
            url: `${DB_ROOT}/pools/${poolAddress}/rules/${id}.json`,
        });

        return r.data;
    } catch (e) {
        console.error(e);
    }
}

async function getRewardPoolAddress(id: string) {
    console.log(new Date().getTime(), "Invoked getRewardPoolAddress");
    try {
        const r = await axios({
            method: "GET",
            url: `${DB_ROOT}/slack/${id}/rewardPool.json`,
        });

        return r.data;
    } catch (e) {
        console.error(e);
    }
}

async function getUID(id: string) {
    console.log(new Date().getTime(), "Invoked getUID");
    try {
        const r = await axios({
            method: "GET",
            url: `${DB_ROOT}/slack/${id}/uid.json`,
        });

        return r.data;
    } catch (e) {
        console.error(e);
    }
}

async function getMember(uid: string) {
    console.log(new Date().getTime(), "Invoked getMember");
    try {
        const r = await axios({
            method: "GET",
            url: `${DB_ROOT}/users/${uid}.json`,
        });

        return r.data;
    } catch (e) {
        console.error(e);
    }
}

async function pushReward(poolAddress: string, id: number) {
    console.log(new Date().getTime(), "Invoked pushReward");
    try {
        const r = await axios({
            method: "POST",
            url: `${DB_ROOT}/pools/${poolAddress}/rewards.json`,
            data: JSON.stringify({
                pool: poolAddress,
                rule: id,
            }),
        });
        
        return r;
    } catch (e) {
        console.error(e);
    }
}

async function setReward(poolAddress: string, id: number, key: string) {
    console.log(new Date().getTime(), "Invoked setReward");
    try {
        const r = await axios({
            method: "POST",
            url: `${DB_ROOT}/pools/${poolAddress}/rewards/${key}.json`,
            data: JSON.stringify({
                pool: poolAddress,
                rule: id,
                key: key,
            }),
        });
        
        return r;
    } catch (e) {
        console.error(e);
    }
}

async function proposeReward(channel: string, member: any, id: any, poolAddress: string, key: string, amount: string) {
    console.log(new Date().getTime(), "Invoked proposeReward");
    console.log(new Date().getTime(), channel, member, id, poolAddress, key, amount);
    try {
        const payload: any = {
            as_user: true,
            channel,
            text: `:moneybag: *Congratulations!* *${member.firstName} ${member.lastName}* has rewarded you *${amount} THX*.`,
            attachments: [
                {
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text:
                                    "Scan the QR code with your THX wallet and claim this reward. \n You don't have a wallet? No harm done, register a fresh one!",
                            },
                            accessory: {
                                type: "image",
                                image_url: `${API_ROOT}/qr/claim/${poolAddress}/${id}/${key}`,
                                alt_text: "qr code for reward verification",
                            },
                        },
                        {
                            type: "actions",
                            elements: [
                                {
                                    type: "button",
                                    url: `${APP_ROOT}/register`,
                                    text: {
                                        type: "plain_text",
                                        text: "Register Wallet",
                                    },
                                    style: "primary",
                                },
                                {
                                    type: "button",
                                    url: "https://www.thxprotocol.com/",
                                    text: {
                                        type: "plain_text",
                                        text: "More info",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        console.log(payload);
        const r = await axios({
            method: "POST",
            url: "https://slack.com/api/chat.postMessage",
            headers: {
                "Authorization": "Bearer xoxb-874849905696-951441147569-jiqzfWErHKgPlDvBNzE40Jwh",
                "Content-Type": "application/json;charset=utf-8",
            },
            data: JSON.stringify(payload),
        });
        
        return r;
    } catch(e) {
        console.error(e);    
    };
}

/**
 * POST /slack/connect
 * Connect Slack account to Reward Pool
 */
export const connectAccount = (req: Request, res: Response) => {
    console.log(new Date().getTime(), "Invoked connectAccount");
    
    const query = req.body.text.split(" ");

    res.send({
        as_user: true,
        attachments: [
            {
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "*Connect your Slack account a Reward Pool!*",
                        },
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `Scan this QR code with your THX wallet. \n Reward pool: *${query[0]}* \n Slack ID: *${req.body.user_id}*`,
                        },
                        accessory: {
                            type: "image",
                            image_url: API_ROOT + `/qr/connect/${query[0]}/${req.body.user_id}`,
                            alt_text: "qr code for connecting your account to a pool",
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
export const sendReward = async (req: Request, res: Response) => {
    console.log(new Date().getTime(), "Invoked sendReward");

    const query = req.body.text.split(" ");
    const poolAddress = await getRewardPoolAddress(req.body.user_id);
    const uid: any = await getUID(req.body.user_id);
    const member: any = await getMember(uid);
    
    PoolContract.options.address = poolAddress;

    if (query[0].startsWith("<@")) {
        const channel = query[0].split("@")[1].split("|")[0];
        const id = query[1];
        const rule = await PoolContract.methods.rules(id).call({ from: API_ADDRESS });
        const response: any = pushReward(poolAddress, id);
        
        await setReward(poolAddress, id, response.name); 
        await proposeReward(channel, member, rule, poolAddress, response.name, rule.amount);

        res.send({
            text: "*Your reward is sent!* :money_with_wings: Make sure your reward is claimed by the beneficiary.",
        });
    } else {
        res.send({
            text: "Make sure to mention a pool member and provide the rule ID.",
        });;
    }
};

/**
 * POST /slack/rules
 * List Reward Rules for connected Reward Pool
 */
export const getRewardRules = async (req: Request, res: Response) => {
    console.log(new Date().getTime(), "Invoked getRewardRules");

    const query = req.body.text.split(" ");
    const poolAddress = await getRewardPoolAddress(req.body.user_id);
    
    PoolContract.options.address = poolAddress;

    if (query[0] === "list") {
        const poolName = await PoolContract.methods.name().call({ from: API_ADDRESS });
        const amountOfRules = parseInt(await PoolContract.methods.countRules().call({ from: API_ADDRESS }), 10);
        
        if (amountOfRules > 0) {
            let message = `*${poolName}* has ${amountOfRules} reward rules available: `;

            for (let id = 0; id < amountOfRules; id++) {
                const ruleMetaData: any = await getRewardRule(id, poolAddress);
                const ruleContractData = await PoolContract.methods.rules(id).call({ from: API_ADDRESS });

                message += "\n• `#" + id + "` *" + utils.fromWei(ruleContractData.amount, "ether") + " THX* - " + ruleMetaData.title;
            }
            
            res.send({
                text: message,
            });
        } else {
            res.send({
                text: `*${poolName}* has 0 rules available.`,
            });
        } 
    }  else if (!isNaN(query[0])) {
        const id = parseInt(query[0], 10);
        const rule: any = await getRewardRule(id, poolAddress);
        const r = await PoolContract.methods.rules(id).call({ from: API_ADDRESS });
        
        res.send({
            text: "`#" + id + "` *" + utils.fromWei(r.amount, "ether") + " THX* - " + rule.title + ":\n _" + rule.description + "_",
        });
    } else {
        res.send({
            text: "Send a query with your command. \n Example: `/rules list` or `/rules 0`"
        });
    }
};

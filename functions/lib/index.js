"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const loom_js_1 = require("loom-js");
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const Web3 = require('web3');
const POOL_ADDRESS = "0xf1E0b062BfBa97c43385cEe1a9276D042876cE8b";
const API_ROOT = 'https://us-central1-thx-wallet-dev.cloudfunctions.net/api';
const APP_ROOT = 'https://thx-wallet-dev.firebaseapp.com';
const REWARD_POOL_JSON = require('./contracts/RewardPool_meta.json');
const EXTDEV_CHAIN_ID = 'extdev-plasma-us1';
const PRIVATE_KEY_ARRAY = loom_js_1.CryptoUtils.generatePrivateKey();
const PUBLIC_KEY = loom_js_1.CryptoUtils.publicKeyFromPrivateKey(PRIVATE_KEY_ARRAY);
const API_ADDRESS = loom_js_1.LocalAddress.fromPublicKey(PUBLIC_KEY).toString();
const client = new loom_js_1.Client(EXTDEV_CHAIN_ID, 'wss://extdev-plasma-us1.dappchains.com/websocket', 'wss://extdev-plasma-us1.dappchains.com/queryws');
const SLACK_ERROR = {
    "response_type": "ephemeral",
    "text": "Sorry, that didn't work. Please try again.",
};
const provider = new loom_js_1.LoomProvider(client, PRIVATE_KEY_ARRAY);
const web3 = new Web3(provider);
const POOL_CONTRACT = new web3.eth.Contract(REWARD_POOL_JSON.output.abi, POOL_ADDRESS);
const utils = new Web3().utils;
const slack = express();
const api = express();
function QRBuffer(qrBase64) {
    const regex = /^data:.+\/(.+);base64,(.*)$/;
    const match = qrBase64.match(regex);
    if (match && match[2]) {
        return Buffer.from(match[2], 'base64');
    }
    else {
        return;
    }
}
async function RewardRule(id) {
    const snap = await admin.database().ref(`/pools/${POOL_ADDRESS}/rules/${id}`).once('value');
    const r = snap.val();
    return (r)
        ? {
            id: id,
            title: r.title,
            description: r.description,
            amount: 0,
        }
        : null;
}
async function getRewardRuleBlocks(length) {
    const blocks = [];
    for (let id = 0; id < length; id++) {
        const rule = await RewardRule(id);
        const r = await POOL_CONTRACT.methods.rules(id).call({ from: API_ADDRESS });
        if (rule) {
            rule.amount = r.amount;
            blocks.push("\n• `#" + rule.id + "` *" + utils.fromWei(rule.amount, 'ether') + " THX* - " + rule.title);
        }
    }
    return blocks;
}
admin.initializeApp(functions.config().firebase);
slack.use(cors({ origin: true }));
slack.post('/connect', (req, res) => {
    const imageUrl = API_ROOT + `/qr/connect/${POOL_ADDRESS}/${req.body.user_id}`;
    const message = {
        "as_user": true,
        "attachments": [
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Connect your THX wallet!*"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `Scan the QR code with your authorized THX wallet. \n Verify that you connect with Slack ID: *${req.body.user_id}*`
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": imageUrl,
                            "alt_text": "qr code for connecting your account"
                        }
                    }
                ]
            }
        ]
    };
    res.send(message);
});
slack.post('/reward', (req, res) => {
    const query = req.body.text.split(' ');
    res.send('THXBot is handling your request');
    if (query[0].startsWith('<@')) {
        const channel = query[0].split('@')[1].split('|')[0];
        const rule = query[1];
        const message = {
            "as_user": true,
            "channel": channel,
            "attachments": [
                {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": ":moneybag: *Congratulations! You have received a reward.* \n Scan the QR code with your authorized THX wallet and claim this reward. \n *You don't have a wallet?*:scream: No harm done, register a fresh one!"
                            },
                            "accessory": {
                                "type": "image",
                                "image_url": API_ROOT + `/qr/claim/${POOL_ADDRESS}/${rule}`,
                                "alt_text": "qr code for reward verification"
                            }
                        },
                        {
                            "type": "actions",
                            "elements": [
                                {
                                    "type": "button",
                                    "url": APP_ROOT + "/register",
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Register Wallet"
                                    }
                                },
                                {
                                    "type": "button",
                                    "url": APP_ROOT + `/claim/${POOL_ADDRESS}/${rule}`,
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Claim on this device"
                                    },
                                    "style": "primary"
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        axios_1.default({
            method: 'POST',
            url: 'https://slack.com/api/chat.postMessage',
            headers: {
                'Authorization': 'Bearer xoxb-874849905696-951441147569-jiqzfWErHKgPlDvBNzE40Jwh',
                'Content-Type': 'application/json;charset=utf-8',
            },
            data: message,
        })
            .catch((e) => {
            console.error(e);
        });
    }
    else {
        res.send('Make sure to mention a pool member. \n Example: `/reward @Chuck 1` when you want to reward Chuck with reward rule 1.');
    }
});
slack.post('/rules', async (req, res) => {
    const query = req.body.text.split(' ');
    res.send('THXBot is handling your request');
    if (query[0] === 'list') {
        const length = parseInt(await POOL_CONTRACT.methods.countRules().call({ from: API_ADDRESS }), 10);
        const poolName = await POOL_CONTRACT.methods.name().call({ from: API_ADDRESS });
        const sendMessage = (url, message) => {
            axios_1.default({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                data: message,
            })
                .catch((e) => {
                console.error(e);
                res.send(SLACK_ERROR);
            });
        };
        if (length > 0) {
            const blocks = await getRewardRuleBlocks(length);
            const message = {
                "text": `*${poolName}* has ${blocks.length} reward rules available: `,
            };
            for (const b of blocks) {
                message.text += b;
            }
            sendMessage(req.body.response_url, message);
        }
        else {
            const message = {
                "text": `Pool *${poolName}* has no rules available.`
            };
            sendMessage(req.body.response_url, message);
        }
    }
    else {
        res.send('Send a query with your command. \n Example: `/rules list`');
    }
});
exports.slack = functions.https.onRequest(slack);
api.use(cors({ origin: true }));
api.post('/rewards', async (req, res) => {
    try {
        const data = {
            pool: req.body.pool,
            rule: req.body.rule,
            address: req.body.address,
        };
        const pool = new web3.eth.Contract(REWARD_POOL_JSON.output.abi, data.pool);
        const tx = await pool.methods.createReward(data.rule, data.address).send({ from: API_ADDRESS });
        res.send(tx);
    }
    catch (e) {
        console.error(e);
        res.send(e);
    }
});
api.get('/rules/:id', async (req, res) => {
    const rule = await RewardRule(req.params.id);
    res.writeHead((rule) ? 200 : 404, {
        'Content-Type': 'application/json',
    });
    res.end(JSON.stringify(rule));
});
api.get('/rules', async (req, res) => {
    const length = parseInt(await POOL_CONTRACT.methods.countRules().call({ from: API_ADDRESS }), 10);
    if (length > 0) {
        const rules = [];
        for (let id = 0; id < length; id++) {
            const rule = await RewardRule(id);
            const r = await POOL_CONTRACT.methods.rules(id).call({ from: API_ADDRESS });
            if (rule) {
                rule.amount = r.amount;
                rules.push(rule);
            }
        }
        res.writeHead(200, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify(rules));
    }
    else {
        res.writeHead(404, {
            'Content-Type': 'application/json',
        });
        res.end({
            "message": `Pool *${POOL_ADDRESS}* has no rules available.`
        });
    }
});
api.get('/qr/connect/:pool/:slack', async (req, res) => {
    const data = {
        pool: req.params.pool,
        slack: req.params.slack,
    };
    const qrBase64 = await qrcode.toDataURL(JSON.stringify(data));
    res.writeHead(200, {
        'Content-Type': 'image/png',
    });
    res.end(QRBuffer(qrBase64));
});
exports.api = functions.https.onRequest(api);
//# sourceMappingURL=index.js.map
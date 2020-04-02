import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { LocalAddress, CryptoUtils, LoomProvider, Client } from 'loom-js';

const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const Web3 = require('web3');

const POOL_ADDRESS = "0xf1E0b062BfBa97c43385cEe1a9276D042876cE8b";
const API_ROOT = 'https://us-central1-thx-wallet-dev.cloudfunctions.net/api';
const APP_ROOT = 'https://thx-wallet-dev.firebaseapp.com';
const REWARD_POOL_JSON = require('./contracts/RewardPool_meta.json');
const EXTDEV_CHAIN_ID = 'extdev-plasma-us1';
const PRIVATE_KEY_ARRAY = CryptoUtils.generatePrivateKey();
const PUBLIC_KEY = CryptoUtils.publicKeyFromPrivateKey(PRIVATE_KEY_ARRAY);
const API_ADDRESS = LocalAddress.fromPublicKey(PUBLIC_KEY).toString();
const client: any = new Client(
    EXTDEV_CHAIN_ID,
    'wss://extdev-plasma-us1.dappchains.com/websocket',
    'wss://extdev-plasma-us1.dappchains.com/queryws',
);
const SLACK_ERROR = {
    "response_type": "ephemeral",
    "text": "Sorry, that didn't work. Please try again.",
};
const provider = new LoomProvider(client, PRIVATE_KEY_ARRAY);
const web3 = new Web3(provider);
const POOL_CONTRACT = new web3.eth.Contract(REWARD_POOL_JSON.output.abi, POOL_ADDRESS);
const utils = new Web3().utils;

const slack = express();
const api = express();

function QRBuffer(qrBase64: string) {
    const regex = /^data:.+\/(.+);base64,(.*)$/;
    const match = qrBase64.match(regex);

    if (match && match[2]) {
        return Buffer.from(match[2], 'base64');
    } else {
        return;
    }
}

async function RewardRule(id: number) {
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

async function getRewardRuleBlocks(length: number) {
    const blocks: string[] = [];
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

api.use(cors({ origin: true }));

api.post('/rewards', async (req: any, res: any) => {
    try {
        const data = {
            pool: req.body.pool,
            rule: req.body.rule,
            address: req.body.address,
        };
        const pool = new web3.eth.Contract(REWARD_POOL_JSON.output.abi, data.pool);
        const tx = await pool.methods.createReward(data.rule, data.address).send({ from: API_ADDRESS });

        res.send(tx);
    } catch (e) {
        console.error(e);
        res.send(e);
    }
});

api.get('/rules/:id', async (req: any, res: any) => {
    const rule = await RewardRule(req.params.id);
    res.writeHead((rule) ? 200 : 404, {
        'Content-Type': 'application/json',
    });
    res.end(JSON.stringify(rule));
});

api.get('/rules', async (req: any, res: any) => {
    const length = parseInt(await POOL_CONTRACT.methods.countRules().call({ from: API_ADDRESS }), 10);

    if (length > 0) {
        const rules: any[] = [];

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
    } else {
        res.writeHead(404, {
            'Content-Type': 'application/json',
        });
        res.end({
            "message": `Pool *${POOL_ADDRESS}* has no rules available.`
        });
    }
});

api.get('/qr/connect/:pool/:slack', async (req: any, res: any) => {
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

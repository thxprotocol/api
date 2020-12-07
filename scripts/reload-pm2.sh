#!/bin/bash
cd ~/api
pm2 restart dist/src/server.js --name api
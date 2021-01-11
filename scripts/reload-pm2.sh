#!/bin/bash
NODE_ENV=staging pm2 start api --update-env -e /home/ubuntu/api/dist/logs/error.log -l /home/ubuntu/api/dist/logs/combined.log
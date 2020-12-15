#!/bin/bash
NODE_ENV=staging pm2 start api --update-env -e ~/api/dist/logs/error.log -l ~/api/dist/logs/combined.log
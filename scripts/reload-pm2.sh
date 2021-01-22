#!/bin/bash
pm2 kill && pm2 start ecosystem.config.js --update-env

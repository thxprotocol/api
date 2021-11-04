#!/bin/bash
npm run migrate
pm2 reload api --update-env
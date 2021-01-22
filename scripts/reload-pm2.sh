#!/bin/bash
if [ "$DEPLOYMENT_GROUP_NAME" == "develop" ]; then
    pm2 kill && pm2 start ecosystem.config.js --env staging --update-env 
elif [ "$DEPLOYMENT_GROUP_NAME" == "master" ]; then
    pm2 kill && pm2 start ecosystem.config.js --env production --update-env 
else
  # Fail the deployment
fi
#! /bin/bash

GANACHE_VERSION=v7.0.2
THX_ARTIFACTS_VERSION=v1.0.1 #should match package.json
SCRIPT_IMAGE_VERSION=v1.0.0  # version of the image
IMAGE_VERSION=$GANACHE_VERSION-$THX_ARTIFACTS_VERSION-$SCRIPT_IMAGE_VERSION
CMD='--account=0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff,100000000000000000000 --account=0x5a05e38394194379795422d2e8c1d33e90033d90defec4880174c39198f707e3,100000000000000000000 -l 25000000 --database.dbPath=/ganache-data'
OVERRIDE_CMD='["--account=0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff,100000000000000000000", "--account=0x5a05e38394194379795422d2e8c1d33e90033d90defec4880174c39198f707e3,100000000000000000000", "-l 25000000",  "--database.dbPath=/ganache-data"]'

# Log in to ecr
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/o5j5y3t5

# Start container and store id
CONTAINER_ID=$(docker run --detach -p 8546:8545 trufflesuite/ganache:$GANACHE_VERSION $CMD)

sleep 1

# Run deploy to store contracts
npm run deploy Main
# Stop the container
docker stop $CONTAINER_ID

# Commit current state and push to registry
docker commit --change="CMD $OVERRIDE_CMD" $CONTAINER_ID ganache-thx-artifacts:$IMAGE_VERSION
docker tag ganache-thx-artifacts:$IMAGE_VERSION public.ecr.aws/o5j5y3t5/ganache-thx-artifacts:$IMAGE_VERSION
docker push public.ecr.aws/o5j5y3t5/ganache-thx-artifacts:$IMAGE_VERSION

# Remove container, we'll start new ones through docker-compose
docker rm $CONTAINER_ID

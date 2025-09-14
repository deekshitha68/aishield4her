#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CC_SRC_LANGUAGE="node"
CC_SRC_PATH="../chaincode/node/"

# launch network; create channel and join peer to channel
pushd ../fabric-network
./network.sh down
./network.sh up createChannel -c mychannel -ca
popd

# Deploy the chaincode
./deploy-chaincode.sh mychannel aishield4her 1

printf "\nTotal setup execution time : $(($(date +%s) - starttime)) secs ...\n\n\n"
#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This script brings up a Hyperledger Fabric network for testing purposes.

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config/
export VERBOSE=false

# Import utils
. scripts/utils.sh

#
# Before you can bring up a network, each organization needs to generate the crypto
# material that will define that organization on the network. Because Hyperledger
# Fabric is a permissioned blockchain, every identity on the network needs to be
# created – certificates and keys – before it can join the network.
#
function createOrgs() {

  if [ -d "crypto" ]; then
    rm -Rf crypto
  fi

  # Create crypto material using cryptogen
  infoln "Generating certificates using cryptogen tool"
  cryptogen generate --config=./config/crypto-config.yaml --output="crypto"
  if [ $? -ne 0 ]; then
    fatalln "Failed to generate certificates..."
  fi
}

# The network is defined by the docker-compose file.
function networkUp() {
  # generate artifacts if they don't exist
  if [ ! -d "artifacts" ]; then
    createConsortium
  fi

  COMPOSE_FILES="-f docker-compose.yaml"

  IMAGE_TAG=$IMAGETAG docker-compose ${COMPOSE_FILES} up -d 2>&1

  docker ps -a
  if [ $? -ne 0 ]; then
    fatalln "Unable to start network"
  fi
}

# Tear down running network
function networkDown() {
  docker-compose -f docker-compose.yaml down --volumes --remove-orphans
  # remove artifacts
  rm -rf artifacts
  # remove crypto
  rm -rf crypto
}

# Generate orderer system channel genesis block.
function createConsortium() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    fatalln "configtxgen tool not found."
  fi

  infoln "Generating Orderer Genesis block"
  mkdir -p artifacts

  set -x
  configtxgen -profile OneOrgOrdererGenesis -channelID system-channel -outputBlock ./artifacts/genesis.block
  res=$?
  { set +x; } 2>/dev/null
  if [ $res -ne 0 ]; then
    fatalln "Failed to generate orderer genesis block..."
  fi
}

# Create the application channel
function createChannel() {
  export CHANNEL_NAME="mychannel"
  
  if [ ! -d "artifacts" ]; then
    mkdir artifacts
  fi

  set -x
  configtxgen -profile OneOrgChannel -outputCreateChannelTx ./artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
  res=$?
  { set +x; } 2>/dev/null
  verifyResult $res "Failed to generate channel configuration transaction..."

  infoln "Creating channel ${CHANNEL_NAME}"
  set -x
  # Use peer0 from org1 to create the channel
  setGlobals 1
  peer channel create -o localhost:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.example.com -f ./artifacts/${CHANNEL_NAME}.tx --outputBlock ./artifacts/${CHANNEL_NAME}.block --tls --cafile $ORDERER_CA
  res=$?
  { set +x; } 2>/dev/null
  verifyResult $res "Channel creation failed"
  
  # Join peer0 from org1 to the channel
  infoln "Joining peer0.org1 to the channel..."
  peer channel join -b ./artifacts/$CHANNEL_NAME.block
}


## Parse commandline args
MODE=$1
shift
# Determine whether starting, stopping, restarting, generating or upgrading
if [ "$MODE" == "up" ]; then
  infoln "Starting network"
  createOrgs
  networkUp
elif [ "$MODE" == "down" ]; then
  infoln "Stopping network"
  networkDown
elif [ "$MODE" == "createChannel" ]; then
  infoln "Creating channel"
  createChannel
else
  printHelp
  exit 1
fi
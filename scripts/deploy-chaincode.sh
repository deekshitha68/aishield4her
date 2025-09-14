#!/bin/bash

CHANNEL_NAME="$1"
CC_NAME="$2"
CC_VERSION="$3"
: ${CHANNEL_NAME:="mychannel"}
: ${CC_NAME:="aishield4her"}
: ${CC_VERSION:="1"}

CC_SRC_PATH="../chaincode/node/"
CC_RUNTIME_LANGUAGE="node"

# Function to display help message
function printHelp() {
  echo "Usage: "
  echo "  deploy-chaincode.sh <ChannelName> <ChaincodeName> <Version>"
  echo "  deploy-chaincode.sh mychannel aishield4her 1"
}

# Check if channel name is provided
if [ -z "$CHANNEL_NAME" ]; then
  echo "Channel name not provided!"
  printHelp
  exit 1
fi

# Set environment variables for the peer
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../fabric-network/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/../fabric-network/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export FABRIC_CFG_PATH=${PWD}/../fabric-network/config/

echo "Packaging chaincode..."
peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CC_NAME}_${CC_VERSION}

echo "Installing chaincode on peer0.org1..."
peer lifecycle chaincode install ${CC_NAME}.tar.gz

# Query installed chaincode to get the package ID
export CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "Package ID: ${CC_NAME}_${CC_VERSION}" | sed -n 's/^Package ID: //; s/, Label:.*$//; p')
echo "Chaincode Package ID: ${CC_PACKAGE_ID}"

echo "Approving chaincode for Org1..."
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile "${PWD}/../fabric-network/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

echo "Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence 1 --tls --cafile "${PWD}/../fabric-network/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --output json

echo "Committing chaincode definition to channel..."
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence 1 --tls --cafile "${PWD}/../fabric-network/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/../fabric-network/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

echo "Querying chaincode definition..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

echo "Chaincode deployment successful!"
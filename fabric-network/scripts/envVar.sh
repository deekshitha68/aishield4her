#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/crypto/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=$1
  infoln "Using organization ${USING_ORG}"
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
  export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
  export CORE_PEER_ADDRESS=localhost:7051
}
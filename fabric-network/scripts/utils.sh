#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
. scripts/envVar.sh

#fatalln echos in red color and exits with fail status
function fatalln() {
  echo -e "\033[31m${1}\033[0m"
  exit 1
}

#infoln echos in blue color
function infoln() {
  echo -e "\033[34m${1}\033[0m"
}

# verify the result of the end-to-end test
function verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}
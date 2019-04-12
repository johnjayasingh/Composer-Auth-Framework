#!/bin/bash
composer network install --archiveFile loc-network.bna --card PeerAdmin@hlfv1
composer network start --networkName loc-network --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
composer card import -f networkadmin.card
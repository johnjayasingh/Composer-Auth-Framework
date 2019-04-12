docker rmi $(docker images --filter=reference="myorg/my-composer-rest-server" -q)

#cd ~/dockertmp

docker build -t myorg/my-composer-rest-server .

cd 
rm *.card
cd ~/fabric-tools
rm -rf ~/.composer
./teardownAllDocker.sh
./startFabric.sh
./createPeerAdminCard.sh

docker run -d --name mongo --network composer_default -p 27017:27017 mongo
#redis-server --port 6379 --protected-mode no
docker run --name composer-redis -p 6379:6379 -h '0.0.0.0'  -d redis 


export NODE_CONFIG='{"composer":{"wallet":{"type":"@ampretia/composer-wallet-redis","desc":"Uses  a local redis instance","options":{"host":"0.0.0.0"}}}}'

cd
source envvars.txt
cd ~/fabric-tools

./createPeerAdminCard.sh


cd
composer network install --archiveFile loc-network.bna --card PeerAdmin@hlfv1
composer network start --networkName loc-network --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
composer card import -f networkadmin.card

composer card export -c admin@loc-network -f networkadmin.card
composer card export -c PeerAdmin@hlfv1 -f PeerAdmin@hlfv1.card

#export NODE_CONFIG='{"composer":{"wallet":{"type":"@ampretia/composer-wallet-redis","desc":"Uses  a local redis instance","options":{}}}}'

composer card import -f networkadmin.card
composer card import -f PeerAdmin@hlfv1.card

composer participant add -c admin@loc-network -d '{"$class":"org.hyperledger.composer.system.NetworkAdmin", "participantId":"restadmin"}'
composer identity issue -c admin@loc-network -f restadmin.card -u restadmin -a "resource:org.hyperledger.composer.system.NetworkAdmin#restadmin"
composer card import -f restadmin.card

#sed -e 's/localhost:/orderer.example.com:/' -e 's/localhost:/peer0.org1.example.com:/' -e 's/localhost:/peer0.org1.example.com:/' -e 's/localhost:/ca.org1.example.com:/'  < $HOME/.composer/cards/restadmin@loc-network/connection.json  > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/restadmin@loc-network/

composer participant add -c admin@loc-network -d '{"$class":"org.gulf.lc.TradeOps","username":"trader1", "name":"Jo"}'

composer identity issue -c admin@loc-network -f jdoe.card -u jdoe -a "resource:org.gulf.lc.TradeOps#trader1"

composer card import -f jdoe.card


#sed -e 's/localhost:/orderer.example.com:/' -e 's/localhost:/peer0.org1.example.com:/' -e 's/localhost:/peer0.org1.example.com:/' -e 's/localhost:/ca.org1.example.com:/' < $HOME/.composer/cards/jdoe@loc-network/connection.json > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/jdoe@loc-network
rm jdoe.card
composer card export -f jdoe_exp.card -c jdoe@loc-network 


composer participant add -c admin@loc-network -d '{"$class":"org.gulf.lc.TradeOps","username":"trader2", "name":"Jo"}'

composer identity issue -c admin@loc-network -f kcoe.card -u kcoe -a "resource:org.gulf.lc.TradeOps#trader2"

composer card import -f kcoe.card

#sed -e 's/localhost:/orderer.example.com:/' -e 's/localhost:/peer0.org1.example.com:/' -e 's/localhost:/peer0.org1.example.com:/' -e 's/localhost:/ca.org1.example.com:/' < $HOME/.composer/cards/kcoe@loc-network/connection.json > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/kcoe@loc-network
rm kcoe.card
composer card export -f kcoe_exp.card -c kcoe@loc-network


export COMPOSER_PROVIDERS='{
    "github": {
        "provider": "github",
        "module": "passport-github",
        "clientID": "2d74910237e2151313dd",
        "clientSecret": "8b347162cf156290ae168bd59adf5e25fcfb1d61",
        "authPath": "/auth/github",
        "callbackURL": "/auth/github/callback",
        "successRedirect": "/",
        "failureRedirect": "/"
    },
    "google": {
        "provider": "google",
        "module": "passport-google-oauth2",
        "clientID": "312039026929-t6i81ijh35ti35jdinhcodl80e87htni.apps.googleusercontent.com",
        "clientSecret": "Q4i_CqpqChCzbE-u3Wsd_tF0",
        "authPath": "/auth/google",
        "callbackURL": "/auth/google/callback",
        "scope": "https://www.googleapis.com/auth/plus.login",
        "successRedirect": "http://localhost:4200?loggedIn=true",
        "failureRedirect": "/"
    },
    "jwt": {
        "provider": "jwt",
        "module": "passport-empty",
        "secretOrKey": "secret",
        "authPath": "/auth/jwt",
        "authScheme": "saml",
        "callbackURL": "/auth/jwt/callback",
        "successRedirect": "http://localhost:4200?loggedIn=true",
        "failureRedirect": "/"
    }
}'

composer-rest-server -c restadmin@loc-network -p 3000 -n never -a true -m true -w true 

composer-playground &
#composer-rest-server -c admin@loc-network -p 3000 -n never -a true -m true -w true 

redis-server --port 6379 --protected-mode no


composer-rest-server -c restadmin@loc-network -a true


docker run -d -e COMPOSER_CARD=${COMPOSER_CARD} -e COMPOSER_NAMESPACES=${COMPOSER_NAMESPACES} -e COMPOSER_AUTHENTICATION=${COMPOSER_AUTHENTICATION} -e NODE_CONFIG="${NODE_CONFIG}" -e COMPOSER_MULTIUSER=${COMPOSER_MULTIUSER} -e COMPOSER_PROVIDERS="${COMPOSER_PROVIDERS}" -e COMPOSER_DATASOURCES="${COMPOSER_DATASOURCES}" -v ~/.composer:/home/composer/.composer --name rest --network composer_default  -p 3000:3000 myorg/my-composer-rest-server
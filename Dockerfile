FROM hyperledger/composer-rest-server

RUN npm install --production @ampretia/composer-wallet-redis passport-github passport-empty passport-jwt loopback-connector-mongodb passport-google-oauth2 && \
    npm cache clean --force && \
    ln -s node_modules .node_modules

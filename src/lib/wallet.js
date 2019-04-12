const { AdminConnection } = require('composer-admin');
const { BusinessNetworkConnection } = require('composer-client');
const { IdCard } = require('composer-common');
const hat = require('hat');
const fs = require('fs');
const request = require('request');
const config = require('config')
/**
 * Retrive card from wallet and upload to rest API session
 */
class Wallet {
    /**
     * Initialize wallet with required details
     * @param {*} username
     * @param {*} apiUrl
     * @param {*} token
     */
    constructor(username, apiUrl, token) {
        this.username = username;
        this.apiUrl = apiUrl;
        this.token = token;
        this.adminConnection = new AdminConnection(config.get('composer'));
    }

    /**
     * Add Participant
     */
    addParticipant(namespace, registry, username) {
        return new Promise(async (resolve, reject) => {
            let businessNetworkConnection = new BusinessNetworkConnection(config.get('composer'));
            try {
                let businessNetworkDefinition = await businessNetworkConnection.connect(this.username);
                let participantRegistry = await businessNetworkConnection.getParticipantRegistry(`${namespace}.${registry}`);
                let factory = businessNetworkDefinition.getFactory();
                let participant = factory.newResource(namespace, registry, username);
                participant.name = username;
                await participantRegistry.add(participant);
                await businessNetworkConnection.disconnect();
                resolve();
            } catch (error) {
                reject(error);
            }
        })
    }
    /**
     * Issue identity for requested user
     * @param {*} namespace
     * @param {*} participant
     * @return {*} card
     */
    issueIdentity(participant, id) {
        return new Promise(async (resolve, reject) => {
            let businessNetworkConnection = new BusinessNetworkConnection(config.get('composer'));
            try {
                let businessNetworkDefinition = await businessNetworkConnection.connect(this.username);
                let card = await this.adminConnection.exportCard(this.username);
                let connectionProfile = card.connectionProfile;
                let businessNetwork = card.metadata.businessNetwork;
                let identity;
                businessNetworkConnection
                    .issueIdentity(`${participant}`, id, {
                        issuer: this.username,
                    })
                    .then((_identity) => {
                        identity = _identity;
                        return new IdCard({
                            userName: identity.userID,
                            enrollmentSecret: identity.userSecret,
                            businessNetwork: businessNetwork,
                        }, connectionProfile);
                    })
                    .then((idCard) => {
                        return this.adminConnection
                            .importCard(identity.userID, idCard);
                    })
                    .then((status) => {
                        return this.adminConnection
                            .connect(identity.userID);
                    })
                    .then((status) => {
                        return this.adminConnection
                            .ping(identity.userID);
                    })
                    .then((status) => {
                        console.log(status);
                        return this.adminConnection
                            .exportCard(identity.userID);
                    })
                    .then(async (idCard) => {
                        const deleteResponse = await this.adminConnection
                            .deleteCard(identity.userID);
                        const importResponse = await this.adminConnection
                            .importCard(identity.userID, idCard);
                        resolve({
                            identity
                        });
                    })
                    // .then((card) => {
                    //     return card
                    //         .toArchive({
                    //             type: 'nodebuffer',
                    //         });
                    // })
                    // .then((cardArcheive) => {
                    //     resolve({
                    //         cardArcheive,
                    //         id,
                    //     });
                    // })
                    .catch((err) => {
                        reject(err);
                    });
            } catch (error) {
                reject(error);
            }

        });
    }
    /**
     * Download current card instance
     * @param {*} username
     * @return {*} card
     */
    downloadCard(username) {
        return new Promise((resolve, reject) => {
            this.adminConnection
                .exportCard(username || this.username)
                .then((card) => {
                    return card.toArchive({
                        type: 'nodebuffer',
                    });
                })
                .then((cardArcheive) => {
                    resolve(cardArcheive);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * Write Buffer to File
     * @param {*} buffer
     * @param {*} destination
     * @return {*} destination
     */
    wrtieToFile(buffer, destination) {
        return new Promise((resolve, reject) => {
            let wstream = fs.createWriteStream(destination);
            wstream.write(buffer);
            wstream.end();
            resolve(destination);
        });
    }

    /**
     * Upload Card
     * @param {*} filepath
     * @param {*} cardName
     * @return {*} session
     */
    uploadToAPI(filepath, cardName) {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                url: `${this.apiUrl}/api/wallet/import`,
                headers: {
                    'X-Access-Token': this.token,
                },
                query: {
                    name: cardName,
                },
                formData: {
                    card: {
                        value: fs.createReadStream(filepath),
                        options: {},
                    },
                },
            };
            const self = this;
            request(options, (error, response, body) => {
                if (error) {
                    reject({
                        token: self.token,
                        cardLoaded: false,
                    });
                }
                if (response) {
                    fs.unlinkSync(filepath);
                    resolve({
                        token: self.token,
                        cardLoaded: response.statusCode === 204,
                    });
                }
            });
        });
    }

    /**
     * List ID Cards
     * @return {*} cards
     */
    listCards() {
        return this.adminConnection.getAllCards();
    }
}

module.exports = Wallet;

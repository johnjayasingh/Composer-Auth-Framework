const Wallet = require('./../lib/wallet');
const hat = require('hat');

const CARD_NAME = 'admin@loc-network';
const API = 'http://localhost:3000';
const TOKEN = 'taxOxWUU5KmbvMDEjKZfrR6Zj9zxbLpIVehb58gDOoHdt58c1RRzdlgzWxHmxmC2'
const ID = hat();

const func = async () => {
    const USER_ID = `adminuser_${new Date().getTime()}`

    const wallet = new Wallet(CARD_NAME, API, TOKEN);
    // console.log(wallet)
    // await wallet.addParticipant('org.gulf.lc', 'Admin', USER_ID).catch((error) => console.log(error));
    // const cardResponse = await wallet.issueIdentity(`org.gulf.lc.Admin#${USER_ID}`, ID).catch((error) => console.log(error));
    // console.log(cardResponse)
    wallet.listCards()
        .then((cards) => {
            cards.forEach(async (card) => {
                let cardName = `${card.metadata.userName}@${card.metadata.businessNetwork}`;
                let destination = `${cardName}.card`;
                let buffer = await card.toArchive({
                    type: 'nodebuffer',
                });
                console.log(cardName)
                
                await wallet.wrtieToFile(buffer, destination).catch((err) => console.log(err));
                await wallet.uploadToAPI(destination, cardName).catch((err) => console.log(err));
            });
        }).catch((err) => console.log(err));
}

func();
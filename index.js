// Require' s
const Express = require('express');
const cors = require('cors');
const config = require('config');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const cookie = require('cookie');
const User = require('./src/model/user');
const hat = require('hat');
const Wallet = require('./src/lib/wallet');
const api = require('./src/routes/api');

// Instances Creation
const app = new Express();

// Request Response Configuration
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

// Logger
app.use(morgan((tokens, req, res) => {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
    ].join(' ');
}));

app.get('/users', (req, res) => {
    res.json().end();
});

app.post('/auth/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user_type = req.body.user_type;
    const card_name = hat();

    new User({
        username,
        password,
        card_name,
        user_type,
    })
        .save()
        .then(async () => {
            const wallet = new Wallet(config.get('app.admin'), '', '');
            await wallet
                .addParticipant(config.get('app.user_namespace'), user_type, username)
                .catch((error) => console.log(error));
            const cardResponse = await wallet
                .issueIdentity
                (`${config.get('app.user_namespace')}.${user_type}#${username}`, card_name)
                .catch((error) => console.log(error));

            res.json({
                message: 'User Registered',
                success: true,
            });
        })
        .catch((err) => {
            console.log(err)
            res.json({
                message: 'Error Occured',
                success: false,
            });
        });

});

app.post('/auth', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    let token = jwt.sign({
        username: username || 'admin',
        id: username || 'admin',
    }, config.get('app.secret'));

    const options = {
        host: config.get('app.host'),
        port: config.get('app.restport'),
        path: config.get('app.restauthpath'),
        method: 'GET',
        headers: {
            authorization: `Bearer ${token}`,
        },
        withCredentials: false,
        signedCookies: false,
    };
    http.get(options, (resp) => {
        const setCookies = resp.headers['set-cookie'];
        if (setCookies.length > 0
            && setCookies[0].indexOf('access_token') !== -1) {
            const sid = hat();
            const token = cookie
                .parse(setCookies[0])
                .access_token
                .split('.')[0]
                .replace('s:', '');
            User
                .findOneAndUpdate(
                    // Find the combination
                    {
                        username,
                        password,
                    },
                    // Update session id and token
                    {
                        $set: {
                            session_id: sid,
                            token,
                            last_login_on: new Date(),
                        },
                    },
                    {
                        new: true,
                    })
                .exec()
                .then(async (result) => {
                    if (result && result.session_id === sid) {
                        console.log(token)
                        await storeCardToSession(result.card_name, token);
                        res.json({
                            sid,
                            message: 'Session Created',
                            success: true,
                        }).end();
                    } else {
                        res.json({
                            sid: null,
                            message: 'User credentials mismatch',
                            success: false,
                        });
                    }
                });
        } else {
            res.json({
                sid: null,
                message: 'API ISSUE: Token generation unsuccessfull.',
                success: false,
            });
        }
    }).on('error', (err) => {
        res.json(options).end();
    });
});

app.use('/api', api);

const storeCardToSession = (_cardName, token) => {
    return new Promise((resolve, reject) => {
        const wallet = new Wallet(config.get('app.admin'), `http://${config.get('app.host')}:${config.get('app.restport')}`, token);
        wallet
            .listCards()
            .then((cards) => {
                cards.forEach(async (card) => {
                    console.log(card);                    
                    if (card.metadata.userName === _cardName) {

                        let cardName = `${card.metadata.userName}@${card.metadata.businessNetwork}`;
                        let destination = `${cardName}.card`;
                        let buffer = await card.toArchive({
                            type: 'nodebuffer',
                        });
                        await wallet.wrtieToFile(buffer, destination).catch((err) => console.log(err));
                        await wallet.uploadToAPI(destination, cardName).catch((err) => console.log(err));
                        resolve(cardName);
                    }
                });
            })
            .catch((err) => reject(err));
    })

}


// Server Started
app.listen(config.get('app.port'), config.get('app.host'), () => {
    console.log('Server Started', config.get('app.port'));
});

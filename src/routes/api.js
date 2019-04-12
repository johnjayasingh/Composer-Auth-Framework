const { Router } = require('express');
const config = require('config');
const router = new Router();
const request = require('request');
const User = require('./../model/user');

router.all('*', (req, res) => {
    const sid = req.headers['sid'] || req.query.sid || req.body.sid;
    User
        .findOne({
            session_id: sid,
        })
        .exec()
        .then((data) => {
            request(`http://${config.get('app.host')}:${config.get('app.restport')}${req.originalUrl}`, {
                method: req.method,
                headers: {
                    'X-Access-Token': data['token'],
                },
            }).pipe(res);
        });
});

module.exports = router;

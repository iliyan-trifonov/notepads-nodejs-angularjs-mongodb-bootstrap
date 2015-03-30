'use strict';

var express = require('express'),
    router = express.Router(),
    User = require('../models/user'),
    graph = require('fbgraph'),
    config = require('../../config/app.conf.json');

//base: /users

router.post('/auth', function (req, res) {
    var fbUserId = req.body.fbId,
        fbAccessToken = req.body.fbAccessToken,
        accessToken = req.body.accessToken;

    console.log('params', fbUserId, fbAccessToken, accessToken);

    if (!fbUserId || (!fbAccessToken && !accessToken)) {
        return res.status(500).send("Not enough data!");
    }

    if (accessToken) {
        User.getByAccessToken(accessToken, function (err, user) {
            if (err) {
                return res.json(500, err);
            }

            if (!user) {
                console.log('Invalid Access Token!', accessToken);
                return res.status(500).json('Invalid Access Token!');
            }
        });
    } else {
        graph.setAppSecret(config.facebook.app.secret);
        graph.setAccessToken(fbAccessToken);

        graph.get('me?id,displayName,photo', function (err, graphUser) {
            if (err) {
                return res.json(400, err);
            }

            if (graphUser.id !== fbUserId) {
                return res.json(400, {error: "User ID and AccessToken don't match!"});
            }

            console.log('/me user from token:', graphUser);

            User.fb(fbUserId, function (err, user) {
                if (err) {
                    return res.json(400, err);
                }

                if (!user) {
                    User.create({
                        facebookId: graphUser.id,
                        name: graphUser.displayName,
                        photo: graphUser.photos[0].value
                    }, function (err, user) {
                        if (err) {
                            return res.json(400, err);
                        }

                        if (!user) {
                            return res.json(400, {error: 'Could not create new user!'});
                        }

                        return res.json(200, {accessToken: user.accessToken});
                    });
                }

                return res.json(200, {accessToken: user.accessToken});
            });

        });
    }
});

module.exports = exports = router;

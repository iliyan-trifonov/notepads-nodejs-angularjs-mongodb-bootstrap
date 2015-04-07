'use strict';

var express = require('express'),
    router = express.Router(),
    User = require('../models/user'),
    graph = require('fbgraph'),
    config;

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
                //user does not exist
                return res.json(500, err);
            }

            if (!user) {
                console.log('Invalid Access Token!', accessToken);
                return res.status(500).json('Invalid Access Token!');
            }
        });
    } else {
        console.log('graph: set appsecret to: ' + config.facebook.app.secret);
        graph.setAppSecret(config.facebook.app.secret);
        graph.setAccessToken(fbAccessToken);

        graph.get('me?fields=id,name,picture', function (err, graphUser) {
            if (err) {
                return res.status(400).json(err);
            }

            if (graphUser.id !== fbUserId) {
                return res.json(400, {error: "User ID and AccessToken don't match!"});
            }

            console.log('/me user from token:', graphUser);

            User.fb(fbUserId, function (err, user) {
                if (err) {
                    console.log('API: error searching for user with User.fb('+fbUserId+')', err, user);
                    return res.json(400, err);
                }

                if (!user) {
                    //TODO: use var obj = {...} to avoid repeated code for log
                    console.log('API: creating new user', {
                        facebookId: graphUser.id,
                        name: graphUser.name,
                        photo: graphUser.picture.data.url
                    });
                    User.create({
                        facebookId: graphUser.id,
                        name: graphUser.name,
                        photo: graphUser.picture.data.url
                    }, function (err, user) {
                        console.log('new user created results', err, user);
                        if (err) {
                            console.log('API: error creating new user, err = ', err);
                            return res.json(400, err);
                        }

                        if (!user) {
                            console.log('API: error creating new user, user = ', user);
                            return res.json(400, {error: 'Could not create new user!'});
                        }

                        return res.status(200).json({accessToken: user.accessToken});
                    });
                } else {
                    console.log('user exists, returning accessToken', user);
                    return res.status(200).json({accessToken: user.accessToken});
                }
            });

        });
    }
});

module.exports = exports = router;

module.exports.setAppConfig = exports.setAppConfig = function (cnf) {
    config = cnf;
};

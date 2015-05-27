'use strict';

var express = require('express'),
    router = express.Router(),
    User = require('../models/user'),
    graph = require('fbgraph'),
    notepadsUtils = require('../notepadsUtils'),
    config;

//base: /users

router.post('/auth', function (req, res) {
    var fbUserId = req.body.fbId,
        fbAccessToken = req.body.fbAccessToken,
        accessToken = req.body.accessToken;

    console.log('params', fbUserId, fbAccessToken, accessToken);

    if (!fbUserId || (!fbAccessToken && !accessToken)) {
        console.log('API /auth: not enough params!', fbUserId, fbAccessToken, accessToken);
        return res.status(500).send("Not enough data!");
    }

    if (accessToken) {
        var blockUser = function blockUser () {
            var err = 'Invalid Access Token!';
            console.error(err);
            return res.status(500).json(err);
        };
        User.getByAccessTokenAsync(accessToken).then(function (user) {
            if (!user) {
                blockUser();
            }
        }).catch(function (/*err*/) {
            blockUser();
        });
    } else {
        console.log('graph: set app secret to: ' + config.facebook.app.secret);
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
                    User.createAsync({
                        facebookId: graphUser.id,
                        name: graphUser.name,
                        photo: graphUser.picture.data.url
                    }).then(function (user) {
                        console.log('new user created results', user);

                        if (!user) {
                            console.log('API: error creating new user, user = ', user);
                            return res.json(400, {error: 'Could not create new user!'});
                        }

                        notepadsUtils.prepopulate(user._id, function (err, obj) {
                            if (err) {
                                console.log('error prepopulating for a new user', err, obj);
                                //return res.status(500).json(err);
                            }
                            return res.status(200).json({accessToken: user.accessToken});
                        });

                    }).catch(function (err) {
                        console.log('API: error creating new user, err = ', err);
                        return res.json(400, err);
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

'use strict';

var express = require('express'),
    app = express(),
    router = express.Router(),
    User = require('../models/user'),
    graph = require('fbgraph'),
    notepadsUtils = require('../notepadsUtils'),
    Promise = require('bluebird'),
    config;

Promise.promisify(graph.get);

//base: /users

var postAuthHandler = function (req, res) {
    var fbUserId = req.body.fbId,
        fbAccessToken = req.body.fbAccessToken,
        accessToken = req.body.accessToken;

    if (!fbUserId || (!fbAccessToken && !accessToken)) {
        console.error('API /auth: not enough params!', fbUserId, fbAccessToken, accessToken);
        return res.status(500).send("Not enough data!");
    }

    if (accessToken) {
        var blockUser = function blockUser () {
            var err = 'Invalid Access Token!';
            console.error(err);
            return res.status(500).json({ error: err });
        };
        User.getByAccessToken(accessToken)
            .then(function (user) {
                if (!user) {
                    blockUser();
                }
            }).catch(function (/*err*/) {
                blockUser();
            });
    } else {
        graph.setAppSecret(config.facebook.app.secret);
        graph.setAccessToken(fbAccessToken);

        var graphUser;
        var p = graph.getAsync('me?fields=id,name,picture')
            .then(function (user) {
                if (graphUser.id !== fbUserId) {
                    var msg = "User ID and AccessToken don't match!";
                    console.error(msg);
                    res.status(400).json({ error: msg });
                    return p.cancel();
                }

                graphUser = user;

                return User.fb(fbUserId);
            })
            .then(function (user) {
                if (user) {
                    res.status(200).json({accessToken: user.accessToken});
                    return p.cancel();
                }
                else {
                    //TODO: use var obj = {...} to avoid repeated code for log
                    var newUser = {
                        facebookId: graphUser.id,
                        name: graphUser.name,
                        photo: graphUser.picture.data.url
                    };
                    return User.createAsync(newUser);
                }
            })
            .then(function (user) {
                return notepadsUtils.prepopulate(user._id);
            })
            .then(function (user) {
                //success
                res.status(200).json({accessToken: user.accessToken});
            })
            .catch(function (err) {
                console.error('API: /auth error', err);
                return res.status(400).json({ error: err });
            });
    }
};

router.post('/auth', postAuthHandler);

module.exports = exports = router;

module.exports.setAppConfig = exports.setAppConfig = function (cnf) {
    config = cnf;
};

if (app.get('env') === 'test') {
    module.exports.postAuthHandler = exports.postAuthHandler = postAuthHandler;
    module.exports.getAppConfig = exports.getAppConfig = function () {
        return config;
    };
}

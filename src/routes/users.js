'use strict';

var express = require('express'),
    app = express(),
    router = express.Router(),
    User = require('../models/user'),
    graph = require('fbgraph'),
    notepadsUtils = require('../notepadsUtils'),
    Promise = require('bluebird'),
    HttpStatus = require('http-status'),
    config;

Promise.promisify(graph.get);

//base: /users

var postAuthHandler = function (req, res) {
    var fbUserId = req.body.fbId,
        fbAccessToken = req.body.fbAccessToken,
        accessToken = req.body.accessToken;

    if (!fbUserId || (!fbAccessToken && !accessToken)) {
        console.error('API /auth: not enough params!', fbUserId, fbAccessToken, accessToken);
        return res.status(HttpStatus.BAD_REQUEST).json({});
    }

    if (accessToken) {
        var blockUser = function blockUser () {
            var err = 'Invalid Access Token!';
            console.error(err);
            return res.status(HttpStatus.FORBIDDEN).json({});
        };
        return User.getByAccessToken(accessToken)
            .then(function (user) {
                if (!user) {
                    return blockUser();
                }
                return res.status(HttpStatus.OK).json(user);
            }).catch(function (err) {
                console.error(err);
                return blockUser();
            });
    } else {
        graph.setAppSecret(config.facebook.app.secret);
        graph.setAccessToken(fbAccessToken);

        var graphUser;
        var p = graph.getAsync('me?fields=id,name,picture')
            .then(function (fbGraphUser) {
                if (!fbGraphUser || fbGraphUser.id !== fbUserId) {
                    console.error("Invalid user from fbAccessToken!");
                    res.status(HttpStatus.FORBIDDEN).json({});
                    return p.cancel();
                }

                graphUser = fbGraphUser;

                return User.fb(fbUserId);
            })
            .then(function (user) {
                if (user) {
                    res.status(HttpStatus.OK).json({accessToken: user.accessToken});
                    //stop here
                    //TODO: try return Promise.reject() instead:
                    return p.cancel();
                }
                else {
                    return User.createAsync({
                        facebookId: graphUser.id,
                        name: graphUser.name,
                        photo: graphUser.picture.data.url
                    });
                }
            })
            .then(function (user) {
                return notepadsUtils.prepopulate(user._id);
            })
            .then(function (user) {
                //success
                res.status(HttpStatus.OK).json({accessToken: user.accessToken});
            })
            .catch(function (err) {
                console.error('API: /auth error', err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
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

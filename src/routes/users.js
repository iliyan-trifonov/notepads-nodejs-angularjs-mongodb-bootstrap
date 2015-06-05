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

    //check if all required params are given
    if (!accessToken && (!fbUserId || !fbAccessToken)) {
        console.error('API /auth: not enough params!', fbUserId, fbAccessToken, accessToken);
        return res.status(HttpStatus.BAD_REQUEST).json({});
    }

    //find a user by his accessToken
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
        //find a user by his FB access token
        graph.setAppSecret(config.facebook.app.secret);
        graph.setAccessToken(fbAccessToken);

        var graphUser;
        var p = graph.getAsync('me?fields=id,name,picture')
            .then(function (fbGraphUser) {
                //when the given fb id and token mismatch:
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
                    //user found by his FB access token
                    res.status(HttpStatus.OK).json({accessToken: user.accessToken});
                    //stop here
                    //TODO: try return Promise.reject() instead:
                    return p.cancel();
                }
                else {
                    //create a new user
                    return User.createAsync({
                        facebookId: graphUser.id,
                        name: graphUser.name,
                        photo: graphUser.picture.data.url
                    });
                }
            })
            .then(function (user) {
                //pre-populate only for new users
                return notepadsUtils.prepopulate(user._id);
            })
            .then(function (user) {
                //success, return the accessToken
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

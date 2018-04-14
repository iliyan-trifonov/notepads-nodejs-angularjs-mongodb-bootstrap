'use strict';

import { Strategy as FacebookStrategy } from 'passport-facebook';
import * as notepadsUtils from './notepadsUtils';
import User from './models/user';

let config;

let authVerification = function (fbAccessToken, fbRefreshToken, fbProfile, callback) {
    User.fb(fbProfile.id)
    .then(function (existingUser) {
        if (existingUser) {
            return callback(null, existingUser);
        } else {
            return User.create({
                facebookId: fbProfile.id,
                name: fbProfile.displayName,
                photo: fbProfile.photos[0].value
            })
            .then(function (newUser) {
                if (!newUser) {
                    let err = new Error('authVerification(): user creation unsuccessful!');
                    console.error(err, { newUser: newUser });
                    return callback(err, newUser);
                }
                //pre-populate some data for just created users
                notepadsUtils.prepopulate(newUser._id).then(function (result) {
                    //return the new user object
                    callback(null, result.user);
                });
            });
        }
    })
    .then(null, function (err) {
        console.error('authVerification(): error', err);
        return callback(err);
    });
};

let authSerialize = function (user, callback) {
    callback(null, user.facebookId);
};

let authDeserialize = function (fbId, callback) {
    User.fb(fbId).then(function (user) {
        callback(null, user);
    }).then(null, function (err) {
        callback(err);
    });
};

module.exports = exports = function (passport) {
    passport.use(new FacebookStrategy({
            clientID: config.facebook.app.id,
            clientSecret: config.facebook.app.secret,
            callbackURL: config.facebook.app.callbackUrl,
            profileFields: ['id', 'displayName', 'picture']
        },
        authVerification
    ));

    passport.serializeUser(authSerialize);

    passport.deserializeUser(authDeserialize);
};

//export the private functions for tests
if (process.argv[1].match(/_mocha$/)) {
    module.exports.authVerification = exports.authVerification = authVerification;
    module.exports.authSerialize = exports.authSerialize = authSerialize;
    module.exports.authDeserialize = exports.authDeserialize = authDeserialize;
    module.exports.getAppConfig = exports.getAppConfig = function () {
        return config;
    };
}

module.exports.login = exports.login = function (req, res) {
    return res.redirect('/');
};

module.exports.logout = exports.logout = function (req, res) {
    req.logout();
    return res.redirect('/');
};

module.exports.verifyAuth = exports.verifyAuth = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.redirect('/');
    }
};

module.exports.setAppConfig = exports.setAppConfig = function (cnf) {
    config = cnf;
};

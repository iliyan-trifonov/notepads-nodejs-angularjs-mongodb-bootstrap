'use strict';

var config,
    FacebookStrategy = require('passport-facebook').Strategy,
    User = require('./models/user'),
    notepadsUtils = require('./notepadsUtils');

var authVerification = function (fbAccessToken, fbRefreshToken, fbProfile, done) {
    User.fb(fbProfile.id, function (err, existingUser) {
        if (existingUser) {
            console.log('user already in DB');
            return done(null, existingUser);
        } else {
            console.log('creating new user');
            console.log('fb profile', fbProfile);
            User.create({
                facebookId: fbProfile.id,
                name: fbProfile.displayName,
                photo: fbProfile.photos[0].value
            }, function (err, user) {
                if (err || !user) {
                    console.log('authVerification(): user creation unsuccessfull!', err, user);
                    return done(err, user);
                }
                console.log('new user created');
                notepadsUtils.prepopulate(user._id, function (err, obj) {
                    if (err) {
                        console.log('error prepopulating for a new user', err, obj);
                        //return res.status(500).json(err);
                    }
                    return done(err, user);
                });
            });
        }
    });
};

var authSerialize = function (user, done) {
    done(null, user.facebookId);
};

var authDeserialize = function (fbId, done) {
    User.fb(fbId, done);
};

module.exports = exports = function (passport) {
    passport.use(new FacebookStrategy({
            clientID: config.facebook.app.id,
            clientSecret: config.facebook.app.secret,
            callbackURL: '/auth/facebook/callback',
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

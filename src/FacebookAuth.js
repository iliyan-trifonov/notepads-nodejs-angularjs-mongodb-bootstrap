'use strict';

var config,
    FacebookStrategy = require('passport-facebook').Strategy,
    User = require('./models/user');

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
                console.log('new user created');
                return done(err, user);
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

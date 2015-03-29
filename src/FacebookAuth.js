'use strict';

var path = require('path'),
    config = require(path.join('..', 'config', 'app.conf.json')),
    FacebookStrategy = require('passport-facebook').Strategy,
    User = require('./models/user');

var authVerification = function (accessToken, refreshToken, profile, done) {
    User.fb(profile.id, function (err, existingUser) {
        if (existingUser) {
            done(null, existingUser);
        } else {
            var newUser = new User({
                facebookId: profile.id,
                name: profile.displayName,
                photo: profile.photos[0].value
            });
            newUser.save(done);
        }
    });
};

var authSerialize = function (user, done) {
    done(null, user.facebookId);
};

var authDeserialize = function (id, done) {
    User.fb(id, done);
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
    res.redirect('/');
};

module.exports.logout = exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
};

module.exports.verifyAuth = exports.verifyAuth = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.redirect('/');
    }
};

'use strict';

var path = require('path'),
    config = require(path.join('config', 'app.conf.json')),
    FacebookStrategy = require('passport-facebook').Strategy,
    User = require('./models/user');

var authVerification = function (accessToken, refreshToken, profile, done) {
    User.fb(profile.id, function (err, existingUser) {
        if (existingUser) {
            done(null, existingUser);
        } else {
            var newUser = new User({
                facebookId: profile.id,
                username: profile.username,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                photo: profile.photos[0].value
            });
            newUser.save(done);
        }
    });
};

var authSerialize = function (user, done) {
    done(null. user.facebookId);
};

var authDeserialize = function (id, done) {
    User.fb(id, done);
};

module.exports = exports = function (passport) {
    passport.use(new FacebookStrategy({
        clientID: config.facebbok.app.id,
        clientSecret: config.facebook.app.secret,
        callbackURL: '/auth/facebook/callback'
    }),
    authVerification);

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

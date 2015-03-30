'use strict';

var path = require('path'),
    config = require(path.join('..', 'config', 'app.conf.json')),
    FacebookStrategy = require('passport-facebook').Strategy,
    User = require('./models/user');

var authVerification = function (fbAccessToken, fbRefreshToken, fbProfile, done) {
    User.fb(fbProfile.id, function (err, existingUser) {
        if (existingUser) {
            console.log('user already in DB');
            done(null, existingUser);
        } else {
            console.log('creating new user');
/*
            var newUser = new User({
                facebookId: profile.id,
                name: profile.displayName,
                photo: profile.photos[0].value
            });
            newUser.save(done);
*/
            User.create({
                facebookId: fbProfile.id,
                name: fbProfile.displayName,
                photo: fbProfile.photos[0].value
            }, function (err, user) {
                if (err) {
                    throw err;
                }

                console.log('new user created');

                //put err, user params here?
                done();
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

'use strict';

var config,
    FacebookStrategy = require('passport-facebook').Strategy,
    User = require('./models/user'),
    notepadsUtils = require('./notepadsUtils');

var authVerification = function (fbAccessToken, fbRefreshToken, fbProfile, done) {
    var p = User.fbAsync(fbProfile.id).then(function (existingUser) {
        if (existingUser) {
            console.info('user already in DB', existingUser);
            done(null, existingUser);
            //break the promises chain here:
            return p.cancel();
        } else {
            console.info('creating new user', fbProfile);
            return User.createAsync({
                facebookId: fbProfile.id,
                name: fbProfile.displayName,
                photo: fbProfile.photos[0].value
            });
        }
    }).then(function (newUser) {
        console.info('newUser', newUser);
        if (!newUser) {
            var err = new Error('authVerification(): user creation unsuccessful!');
            console.error(err, { newUser: newUser });
            return done(err, newUser);
        }
        console.info('new user created');
        //pre-populate some data for just created users
        notepadsUtils.prepopulate(newUser._id, function (err/*, result*/) {
            if (err) {
                console.error('error pre-populating for a new user', err);
                return done(err);
            }
            //return the new user object
            done(null, newUser);
        });
    }).catch(function (err) {
        console.error('authVerification(): error', err);
        return done(err);
    })/*.cancelable()*/;
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

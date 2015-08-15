'use strict';

let config;

import express from 'express';
import * as routes from './routes';
import session from 'express-session';
//favicon = require('serve-favicon')
import path from 'path';
import passport from 'passport';
import FacebookAuth from './FacebookAuth';
import usersRouter from './routes/users';
import notepadsRouter from './routes/notepads';
import categoriesRouter from './routes/categories';
import HttpStatus from 'http-status';
import User from './models/user';

let app = express();

let envs = ['development', 'production', 'test'];

if (envs.indexOf(app.get('env')) !== -1) {
    console.info(app.get('env') + ' environment detected');
} else {
    console.warn('unrecognized environment detected', app.get('env'));
}

try {
    config = require('../config/app.conf.json');
} catch (err) {
    if (app.get('env') !== 'test') {
        //prod / dev env - cannot work without real config values
        console.error('No configuration file!');
        process.stderr.write(err);
        process.exit();
    } else {
        //test env
        console.error(err);
        config = require('../config/testing.json');
    }
}

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));
//get all data sent to the API inside req.body:
app.use(require('body-parser').json());

if (config) {
    //TODO: disable unneeded stuff like session cookies, etc. when API auth is used
    app.use(session({
        //TODO: check these properties for their default values
        resave: true,
        saveUninitialized: true,
        secret: config.sessionSecret
    }));
    FacebookAuth.setAppConfig(config);
    FacebookAuth.call(null, passport);
    app.use(passport.initialize());
    app.use(passport.session());
}

app.get('/', routes.index);
app.get('/auth/facebook',
    passport.authenticate('facebook', {}),
    () => {}
);
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/'
    }),
    FacebookAuth.login
);
app.get('/logout', FacebookAuth.logout);

//authorize if valid access token is given
//populate req.user from a valid access token
let parseAccessToken = (req, res, next) => {
    let blockUser = err => {
        console.error(err);
        //this may return UNAUTHORIZED instead:
        return res.status(HttpStatus.FORBIDDEN).json({});
    };

    let accessToken = req.headers['x-access-token'] || req.query.token;

    if (accessToken) {
        //this require is used often, may be put on top:
        User.getByAccessToken(accessToken).then(user => {
            if (user) {
                req.user = user;
                //we will have req.user._id and req.user.id:
                req.user.id = user._id;
                next();
            } else {
                return blockUser(`Invalid access token ${accessToken}!`);
            }
        }).catch(err => {
            return blockUser(err);
        });
    } else {
        return next();
    }
};

//API URLs
//allow all locations access to the api urls
if (config) {
    app.use(config.apiBase, (req, res, next) => {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');

        if (req.method === 'OPTIONS') {
            //OPTIONS doesn't need auth or other parsing
            res.status(HttpStatus.OK).end();
        } else {
            // Pass to next layer of middleware
            next();
        }
    });
}

app.use(parseAccessToken);

//API routes
if (config) {
    usersRouter.setAppConfig(config);
    app.use(config.apiBase + '/users', usersRouter);
    app.use(config.apiBase + '/notepads', notepadsRouter);
    app.use(config.apiBase + '/categories', categoriesRouter);
}

//html5 history, no # angular paths, redirect all to index
app.get(['/categories', '/categories/*'], routes.index);
app.get(['/notepads', '/notepads/*'], routes.index);
app.get('/cookie-policy', routes.index);
app.get('/privacy-policy', routes.index);

//dev env
if ('development' === app.get('env')) {
    console.info('activating morgan and errorhandler middleware for dev env');
    app.use(require('morgan')('combined'));
    app.use(require('errorhandler')());
}

let createConnection = () => {
    let connection;
    if ('test' === app.get('env')) {
        connection = require('../test/db_common');
    } else {
        connection = require('./db');
        connection.setAppConfig(config);
    }
    connection().on('connected', err => {
        if (err) {
            process.stderr.write(err);
            process.exit();
        }
    });
};

let startServer = () => {
    app.listen(app.get('port'), () => {
        console.info('Express server listening on port ' + app.get('port'));
    });
};

module.exports = exports = app;
module.exports.createConnection = exports.createConnection = createConnection;
module.exports.startServer = exports.startServer = startServer;
module.exports.parseAccessToken = exports.parseAccessToken = parseAccessToken;

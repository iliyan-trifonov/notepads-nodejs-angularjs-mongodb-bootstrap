'use strict';

var config,
    express = require('express'),
    routes = require('./routes'),
    session = require('express-session'),
    //favicon = require('serve-favicon')
    path = require('path'),
    passport = require('passport'),
    FacebookAuth = require('./FacebookAuth'),
    usersRouter = require('./routes/users'),
    notepadsRouter = require('./routes/notepads'),
    categoriesRouter = require('./routes/categories');

var app = express();

//export NODE_ENV=development npm start
if ('development' === app.get('env')) {
    console.log('development environment detected');
} else if ('production' === app.get('env')) {
    console.log('production environment detected');
} else {
    console.log('unrecognized environment detected', app.get('env'));
}

if (app.get('env') !== 'test') {
    config = require('../config/app.conf.json');
}

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(favicon(__dirname + '/public/favicon.ico'));
if (app.get('env') !== 'test') {
    app.use(session({
        //TODO: check these properties for their default values
        resave: true,
        saveUninitialized: true,
        //TODO: use the app.conf.js config file for this
        secret: config.sessionSecret
    }));
    FacebookAuth.setAppConfig(config);
    FacebookAuth.call(null, passport);
}
app.use(passport.initialize());
app.use(passport.session());
//get all data sent to the API inside req.body
app.use(require('body-parser').json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/auth/facebook',
    passport.authenticate('facebook', {}),
    function () {}
);
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/'
    }),
    FacebookAuth.login
);
app.get('/logout', FacebookAuth.logout);

if (app.get('env') !== 'test') {
//API URLs
//allow all locations access to the api urls
    app.use(config.apiBase, function (req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        // Pass to next layer of middleware
        next();
    });
}
//authorize if valid accesstoken is given
app.use(function (req, res, next) {
    var accessToken = req.query.token;
    console.log('req.query', req.query);
    if (accessToken) {
        console.log('using accessToken for auth', accessToken);
        var User = require('./models/user');
        User.getByAccessToken(accessToken, function (err, user) {
            if (!err && user) {
                console.log('setting req.user from token', user);
                req.user = user;
                next();
            } else {
                if (err) {
                    console.error(err);
                }
                return res.status(403).send('Forbidden');
            }
        });
    } else {
        next();
    }
});

//API routes
if (app.get('env') !== 'test') {
    usersRouter.setAppConfig(config);
    app.use(config.apiBase + '/users', usersRouter);
    app.use(config.apiBase + '/notepads', notepadsRouter);
    app.use(config.apiBase + '/categories', categoriesRouter);
}

//dev env
if ('development' === app.get('env')) {
    //app.use(express.logger('dev')); TODO: check exp4 way
    var errorHandler = require('errorhandler');
    app.use(errorHandler());
}

//server
if (module === require.main) { //started with node app.js
    var connection = require('./db');
    connection.setAppConfig(config);
    connection().on('connected', function (err) {
        if (err) {
            process.stderr.write(err);
            process.exit();
        }
    });

    app.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
} else { //for the tests
    module.exports = exports = app;
}

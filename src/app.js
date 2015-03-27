'use strict';

var express = require('express'),
    routes = require('./routes'),
    //user = require('./routes/user'),
    session = require('express-session'),
    //favicon = require('serve-favicon')
    path = require('path'),
    passport = require('passport'),
    FacebookAuth = require('./FacebookAuth');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(session({
    //TODO: check these properties for their default values
    resave: true,
    saveUninitialized: true,
    //TODO: use the app.conf.js config file for this
    secret: 'SECRET'
}));
FacebookAuth.call(null, passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/auth/facebbok',
    passport.authenticate('facebook', {
        scope: 'email'
    }),
    function () {}
);
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/'
    }),
    FacebookAuth.login
);
app.get('/logout', FacebookAuth.logout);

if ('development' === app.get('env')) {
    var errorHandler = require('errorhandler');
    app.use(errorHandler());
}

if (module === require.main) {
    var connection = require('./db');
    connection().on('connected', function (err) {
        if (err) {
            process.stderr.write(err);
            process.exit();
        }
    });

    app.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
}

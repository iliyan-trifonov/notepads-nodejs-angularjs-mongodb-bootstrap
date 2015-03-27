'use strict';

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    path = require('path'),
    session = require('express-session'),
    favicon = require('serve-favicon'),
    errorHandler = require('errorhandler');

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
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);

if ('development' === app.get('env')) {
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

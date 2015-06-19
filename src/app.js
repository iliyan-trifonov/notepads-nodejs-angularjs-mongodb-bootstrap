'use strict';

require("babel/register");

var app = require('./bootstrap');

//server
if (module === require.main) { //started with node app.js
    app.createConnection();
    app.startServer();
} else { //for the tests
    module.exports = exports = app;
    module.exports.createConnection = exports.createConnection = app.createConnection;
    module.exports.startServer = exports.startServer = app.startServer;
    module.exports.parseAccessToken = exports.parseAccessToken = app.parseAccessToken;
}

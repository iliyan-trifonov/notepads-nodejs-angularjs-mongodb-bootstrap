'use strict';

require("babel/register");

var app = require('./bootstrap');

//server
if (module === require.main) { //started with node app.js
    app.createConnection();
    app.startServer();
} else { //for the tests
    module.exports = exports = app;
}

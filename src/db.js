'use strict';

var mongoose = require('mongoose'),
    config;

var uri;
var options = {
    db: { native_parser: true },
    server: { poolSize: 5 },
    keepAlive: true
};

module.exports = exports = function () {
    var db = mongoose.connect(uri, options);

    db.connection.on('error', function (err) {
        process.stderr.write(err);
        process.exit(1);
    });

    return db.connection;
};

module.exports.setAppConfig = exports.setAppConfig = function (cnf) {
    config = cnf;
    console.log('db: using config - ', config);
    uri = config.mongodb.uri;
};

'use strict';

var mongoose = require('mongoose'),
    config = require('../config/app.conf.json');

var uri = config.mongodb.uri;
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

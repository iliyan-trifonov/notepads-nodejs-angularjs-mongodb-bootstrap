'use strict';

var mongoose = require('mongoose');

var uri = 'mongodb://localhost/notepads';
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

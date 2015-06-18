'use strict';

var mongoose = require('mongoose'),
    assert = require('assert'),
    uri = 'mongodb://localhost/notepads-test',
    options = {
        db: { native_parser: true },
        server: { poolSize: 5 },
        keepAlive: true //this option may have changed its place in this object
    };

module.exports = function () {
    var db = mongoose.connect(uri, options);

    db.connection.on('error', function (err) {
        process.stderr.write(err);
        process.exit(1);
    });

    return db.connection;
};

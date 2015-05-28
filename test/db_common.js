'use strict';

var mongoose = require('mongoose'),
    assert = require('assert'),
    uri = 'mongodb://localhost/notepads-test',
    options = {
        db: { native_parser: true },
        server: { poolSize: 5 },
        keepAlive: true
    };

module.exports = function () {
    var db = mongoose.connect(uri, options);

    db.connection.on('error', function (err) {
        assert.ifError(err);
    });

    return db.connection;
};

'use strict';

let mongoose = require('mongoose'),
    config;

let uri;
let options = {
    db: { native_parser: true },
    server: { poolSize: 5 },
    keepAlive: true //this option may have changed its place in this object
};

module.exports = exports = () => {
    let db = mongoose.connect(uri, options);

    db.connection.on('error', err => {
        process.stderr.write(err);
        process.exit(1);
    });

    return db.connection;
};

module.exports.setAppConfig = exports.setAppConfig = cnf => {
    console.info('db - using config:', cnf);
    config = cnf;
    uri = config.mongodb.uri;
};

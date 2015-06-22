'use strict';

import mongoose from 'mongoose';
let config;

let uri;
let options = {
    db: { native_parser: true },
    server: { poolSize: 5 },
    keepAlive: true //this option may have changed its place in this object
};

let main = () => {
    let db = mongoose.connect(uri, options);

    db.connection.on('error', err => {
        process.stderr.write(err);
        process.exit(1);
    });

    return db.connection;
};

main.setAppConfig = cnf => {
    console.info('db - using config:', cnf);
    config = cnf;
    uri = config.mongodb.uri;
};

//module.exports = exports = main;
export default main;

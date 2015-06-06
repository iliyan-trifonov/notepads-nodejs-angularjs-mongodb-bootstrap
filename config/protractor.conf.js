'use strict';

exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['../test/client/e2e/*.js']
};

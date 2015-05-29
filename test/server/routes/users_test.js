'use strict';

var usersRouter = require('../../../src/routes/users'),
    assert = require('assert'),
    connection = require('../../db_common'),
    User = require('../../../src/models/user'),
    Category = require('../../../src/models/category'),
    Notepad = require('../../../src/models/notepad'),
    HttpStatus = require('http-status'),
    mongoose = require('mongoose');

describe('Users Routes', function () {

    //var db, user, category, req, res;

    describe('postAuthHandler', function () {

    });

    describe('setAppConfig', function () {
        it('should set the given config', function () {
            var config = { test: '', test2: 'asd asd asd' };
            usersRouter.setAppConfig(config);
            assert.deepEqual(usersRouter.getAppConfig(), config);
        });
    });

});

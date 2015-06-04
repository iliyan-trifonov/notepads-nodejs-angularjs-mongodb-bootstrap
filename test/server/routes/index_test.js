'use strict';

var indexRoute = require('../../../src/routes/index'),
    assert = require('assert');

describe('index route\'s .index()', function () {
    var req = {
            user: 'Test user object'
        },
        res = {
            render: function (template, user) {
                assert.strictEqual(template, 'index');
                assert.deepEqual(user, { user: req.user });
            }
        };
    it('should call to render the index page with the logged in user', function () {
        indexRoute.index(req, res);
    });
});

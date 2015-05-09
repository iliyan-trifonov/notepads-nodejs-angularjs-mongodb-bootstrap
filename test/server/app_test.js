'use strict';

var app = require('../../src/app'),
    assert = require('assert');

describe('app', function () {
    it('should have the port set to 3000', function () {
        assert.strictEqual(app.get('port'), 3000);
    });
});

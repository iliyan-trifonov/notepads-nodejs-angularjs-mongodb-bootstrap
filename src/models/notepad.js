'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird');

var notepadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

notepadSchema.static('getByIdForUser', function (notepadId, uid, cb) {
    return this.findOne({ _id: notepadId, user: uid }, 'title text category', cb);
});

notepadSchema.static('getByUserId', function (uid, cb) {
    return this.find({ user: uid }, 'title text category', cb);
});

var Notepad = mongoose.model('Notepad', notepadSchema);

Promise.promisifyAll(Notepad);
Promise.promisifyAll(Notepad.prototype);

module.exports = exports = Notepad;

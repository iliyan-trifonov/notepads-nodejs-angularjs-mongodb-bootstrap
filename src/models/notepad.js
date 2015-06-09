'use strict';

var Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose'));

var notepadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

notepadSchema.static('getByIdForUser', function (notepadId, uid) {
    return this.findOneAsync({ _id: notepadId, user: uid }, 'title text category');
});

notepadSchema.static('getByUserId', function (uid) {
    return this.findAsync({ user: uid }, 'title text category');
});

var Notepad = mongoose.model('Notepad', notepadSchema);

module.exports = exports = Notepad;

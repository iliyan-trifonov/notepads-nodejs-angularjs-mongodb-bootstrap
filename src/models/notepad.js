'use strict';

var mongoose = require('mongoose');

var notepadSchema = new mongoose.Schema({
    title: String,
    text: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

notepadSchema.static('getById', function (id, cb) {
    return this.findOne({ _id: id }, 'title text category', cb);
});

notepadSchema.static('getByUserId', function (uid, cb) {
    return this.find({ user: uid }, 'title text category', cb);
});

var Notepad = mongoose.model('Notepad', notepadSchema);

module.exports = exports = Notepad;

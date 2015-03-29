'use strict';

var mongoose = require('mongoose');

var notepadSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    title: String,
    text: String
});

notepadSchema.static('getById', function (id, cb) {
    return this.findOne({ _id: id }, 'title text category', cb);
});

notepadSchema.static('list', function (userId, cb) {
    return this.find({}, cb);
});

var Notepad = mongoose.model('Notepad', notepadSchema);

module.exports = exports = Notepad;

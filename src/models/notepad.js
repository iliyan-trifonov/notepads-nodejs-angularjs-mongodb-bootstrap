'use strict';

var mongoose = require('mongoose');

var notepadSchema = new mongoose.Schema({
    title: String,
    text: String
});

notepadSchema.static('getById', function (id, cb) {
    return this.findOne({ _id: id }, 'name text', cb);
});

var Notepad = mongoose.model('Notepad', notepadSchema);

module.exports = exports = Notepad;

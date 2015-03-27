'use strict';

var mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
    name: String
});

categorySchema.static('getById', function (id, cb) {
    return this.findOne({ _id: id }, 'name', cb);
});

var Category = mongoose.model('Category', categorySchema);

module.exports = exports = Category;

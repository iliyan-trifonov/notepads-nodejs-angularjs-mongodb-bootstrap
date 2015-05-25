'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird');

//TODO: check if it's possible to add notepads[] with Notepad ids
//TODO: and list them for the Dashboard with one call
var categorySchema = new mongoose.Schema({
    name: String,
    notepadsCount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

categorySchema.static('getByUserId', function (uid, cb) {
    return this.find({ user: uid }, 'name notepadsCount', cb);
});

categorySchema.static('getByIdForUser', function (catId, uid, cb) {
    return this.findOne({ _id: catId, user: uid }, 'name', cb);
});

categorySchema.static('increaseNotepadsCountById', function (catId, cb) {
    return this.findOneAndUpdate({ _id: catId },
        { $inc: { notepadsCount: 1 } },
        { 'new': true },
        cb);
});

categorySchema.static('decreaseNotepadsCountById', function (catId, cb) {
    return this.findOneAndUpdate({ _id: catId },
        { $inc: { notepadsCount: -1 } },
        { 'new': true },
        cb);
});

var Category = mongoose.model('Category', categorySchema);

Promise.promisifyAll(Category);
Promise.promisifyAll(Category.prototype);

module.exports = exports = Category;

'use strict';

var Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose'));

//TODO: check if it's possible to add notepads[] with Notepad ids
//TODO: and list them for the Dashboard with one call
var categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    notepadsCount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

categorySchema.static('getByUserId', function (uid) {
    return this.findAsync({ user: uid }, 'name notepadsCount');
});

categorySchema.static('getByIdForUser', function (catId, uid) {
    return this.findOneAsync({ _id: catId, user: uid }, 'name');
});

categorySchema.static('increaseNotepadsCountById', function (catId) {
    return this.findOneAndUpdateAsync(
        { _id: catId },
        { $inc: { notepadsCount: 1 } },
        { 'new': true }
    );
});

categorySchema.static('decreaseNotepadsCountById', function (catId) {
    return this.findOneAndUpdateAsync(
        { _id: catId },
        { $inc: { notepadsCount: -1 } },
        { 'new': true }
    );
});

var Category = mongoose.model('Category', categorySchema);

module.exports = exports = Category;

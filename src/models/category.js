'use strict';

var mongoose = require('mongoose');

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

categorySchema.static('getById', function (id, cb) {
    return this.findOne({ _id: id }, 'name', cb);
});

categorySchema.static('increaseNotepadsCountById', function (id, cb) {
    return this.findOneAndUpdate({ _id: id }, {
        $inc: { notepadsCount: 1 }
    }, cb);
});

categorySchema.static('decreaseNotepadsCountById', function (id, cb) {
    return this.findOneAndUpdate({ _id: id }, {
        $inc: { notepadsCount: -1 }
    }, cb);
});

//not a real bulk insert - check mongoose docs
//it's possible to call mongo directly for the real thing
//cb will receive as many args as the array's len + err
categorySchema.static('insertMany', function (cats, cb) {
    return this.create(cats, cb);
});

var Category = mongoose.model('Category', categorySchema);

module.exports = exports = Category;

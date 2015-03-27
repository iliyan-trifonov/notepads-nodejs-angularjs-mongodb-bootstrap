'use strict';

var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    facebookId: String,
    username: String,
    firstName: String,
    lastName: String,
    email: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    notepads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notepad' }]
});

userSchema.static('fb', function (id, cb) {
    return this.findOne({ facebookId: id }, cb);
});

userSchema.static('getCategories', function (id, cb) {
    return this.findOne({ _id: id }, 'categories', null, cb);
});

userSchema.static('getNotepads', function (id, cb) {
    return this.findOne({ _id: id }, 'notepads', null, cb);
});

userSchema.static('addCategory', function (userId, categoryId, cb) {
    return this.findOneAndUpdate({ _id: userId }, {
        $addToSet: { categories: categoryId }
    }, cb);
});

userSchema.static('addNotepad', function (userId, notepadId, cb) {
    return this.findOneAndUpdate({ _id: userId }, {
        $addToSet: { notepads: notepadId }
    }, cb);
});

userSchema.static('removeCategory', function (userId, categoryId, cb) {
    return this.findOneAndUpdate({ _id: userId }, {
        $pull: { categories: categoryId }
    }, cb);
});

userSchema.static('removeNotepad', function (userId, notepadId, cb) {
    return this.findOneAndUpdate({ _id: userId }, {
        $pull: { notepads: notepadId }
    }, cb);
});

var User = mongoose.model('User', userSchema);

module.exports = exports = User;

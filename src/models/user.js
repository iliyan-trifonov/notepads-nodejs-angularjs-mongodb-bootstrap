'use strict';

var mongoose = require('mongoose'),
    hat = require('hat');

//TODO: add required to the fields
var userSchema = new mongoose.Schema({
    facebookId: String,
    accessToken: String,
    name: String,
    photo: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    notepads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notepad' }]
});

userSchema.static('create', function (data, cb) {
    var user = new User({
        facebookId: data.facebookId,
        accessToken: hat(),
        name: data.name,
        photo: data.photo
    });
    return user.save(cb);
});

//returns only _id
userSchema.static('getByAccessToken', function (accessToken, cb) {
    return this.findOne({ accessToken: accessToken }, null, null, cb);
});

userSchema.static('fb', function (fbId, cb) {
    return this.findOne({ facebookId: fbId }, 'facebookId accessToken name photo', null, cb);
});

userSchema.static('getCategories', function (uid, cb) {
    return this.findOne({ _id: uid }, 'categories', null, cb);
});

userSchema.static('getNotepads', function (uid, cb) {
    return this.findOne({ _id: uid }, 'notepads', null, cb);
});

userSchema.static('addCategory', function (userId, categoryId, cb) {
    return this.findOneAndUpdate({ _id: userId },
        { $addToSet: { categories: categoryId } },
        { 'new': true },
        cb);
});

userSchema.static('addNotepad', function (userId, notepadId, cb) {
    return this.findOneAndUpdate({ _id: userId },
        { $addToSet: { notepads: notepadId } },
        { 'new': true },
        cb);
});

userSchema.static('removeCategory', function (userId, categoryId, cb) {
    return this.findOneAndUpdate({ _id: userId },
        { $pull: { categories: categoryId } },
        { 'new': true },
        cb);
});

userSchema.static('removeNotepad', function (userId, notepadId, cb) {
    return this.findOneAndUpdate({ _id: userId }, {
        $pull: { notepads: notepadId }
    }, cb);
});

userSchema.static('removeNotepads', function (userId, notepadsIds, cb) {
    return this.findOneAndUpdate(
        { _id: userId },
        { $pull: { notepads: { $in: notepadsIds } } },
        { 'new': true },
    cb);
});

var User = mongoose.model('User', userSchema);

module.exports = exports = User;

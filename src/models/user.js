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

//TODO: fix it with static calls only, no new User, etc.
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

//return only the _id and accessToken for now,
//all that we need to keep a logged in user and make checks on it
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

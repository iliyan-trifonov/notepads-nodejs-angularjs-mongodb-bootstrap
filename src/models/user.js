'use strict';

var mongoose = require('mongoose'),
    //TODO: replace hat with something more specific for API tokens
    hat = require('hat'),
    Promise = require('bluebird');

//TODO: add required to the fields
var userSchema = new mongoose.Schema({
    facebookId: String,
    accessToken: String,
    name: String,
    photo: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    notepads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notepad' }]
});

//TODO: remove the callbacks after promises are used 100%

//override create
//works with callbacks and promises for compatibility - for now - cb will be removed
userSchema.static('create', function (data, cb) {
    var user = new User({
        facebookId: data.facebookId,
        accessToken: hat(),
        name: data.name,
        photo: data.photo
    });
    return user.saveAsync().then(function () {
        return cb(null, user);
    }).catch(function (err) {
        return cb(err);
    });
});

//returns only _id
userSchema.static('getByAccessToken', function (accessToken, cb) {
    return this.findOneAsync({ accessToken: accessToken }).then(function (user) {
        return cb(null, user);
    }).catch(function (err) {
        return cb(err);
    });
});

userSchema.static('fb', function (fbId, cb) {
    return this.findOneAsync({ facebookId: fbId }, 'facebookId accessToken name photo').then(function (user) {
        return cb(null, user);
    }).catch(function (err) {
        return cb(err);
    });
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

Promise.promisifyAll(User);
Promise.promisifyAll(User.prototype);

module.exports = exports = User;

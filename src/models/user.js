'use strict';

var mongoose = require('mongoose'),
    //TODO: replace hat with something more specific for API tokens
    hat = require('hat'),
    Promise = require('bluebird');

//TODO: add required to the fields
var userSchema = new mongoose.Schema({
    facebookId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    photo: { type: String, required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    notepads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notepad' }]
});

//TODO: remove the callbacks after promises are used 100%

//auto create the accessToken
userSchema.pre('validate', function (next) {
    this.accessToken = this.accessToken || hat();
    next();
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
    return this.findOneAsync(
        { facebookId: fbId },
        'facebookId accessToken name photo'
    ).then(function (user) {
        return cb(null, user);
    }).catch(function (err) {
        return cb(err);
    });
});

userSchema.static('getCategories', function (uid, cb) {
    return this.findOneAsync({ _id: uid }, 'categories').then(function (user) {
        return cb(null, user);
    }).catch(function (err) {
        return cb(err);
    });
});

userSchema.static('getNotepads', function (uid, cb) {
    return this.findOneAsync({ _id: uid }, 'notepads').then(function (user) {
        return cb(null, user);
    }).catch(function (err) {
        return cb(err);
    });
});

userSchema.static('addCategory', function (userId, categoryId, cb) {
    return this.findOneAndUpdateAsync({ _id: userId },
        { $addToSet: { categories: categoryId } },
        { 'new': true }).then(function (user) {
            return cb(null, user);
        }).catch(function (err) {
            return cb(err);
        });
});

userSchema.static('addNotepad', function (userId, notepadId, cb) {
    return this.findOneAndUpdate({ _id: userId },
        { $addToSet: { notepads: notepadId } },
        { 'new': true }).then(function (user) {
            return cb(null, user);
        }).catch(function (err) {
            return cb(err);
        });
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

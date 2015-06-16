'use strict';

var Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose')),
    //TODO: replace hat with something more specific for API tokens
    hat = require('hat');

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
userSchema.static('getByAccessToken', accessToken =>
    User.findOneAsync(
        { accessToken: accessToken }
    )
);

userSchema.static('fb', fbId =>
    User.findOneAsync(
        { facebookId: fbId },
        'facebookId accessToken name photo'
    )
);

userSchema.static('getCategories', uid =>
    User.findOneAsync(
        { _id: uid },
        'categories'
    )
);

userSchema.static('getNotepads', uid =>
    User.findOneAsync(
        { _id: uid },
        'notepads'
    )
);

userSchema.static('addCategory', (uid, catId) =>
    User.findOneAndUpdateAsync(
        { _id: uid },
        { $addToSet: { categories: catId } },
        { 'new': true }
    )
);

userSchema.static('addNotepad', (uid, notepadId) =>
    User.findOneAndUpdateAsync(
        { _id: uid },
        { $addToSet: { notepads: notepadId } },
        { 'new': true }
    )
);

userSchema.static('removeCategory', (userId, categoryId) =>
    User.findOneAndUpdateAsync(
        { _id: userId },
        { $pull: { categories: categoryId } },
        { 'new': true }
    )
);

userSchema.static('removeNotepad', (userId, notepadId) =>
    User.findOneAndUpdateAsync(
        { _id: userId },
        { $pull: { notepads: notepadId } },
        { 'new': true }
    )
);

userSchema.static('removeNotepads', (userId, notepadsIds) =>
    User.findOneAndUpdateAsync(
        { _id: userId },
        { $pull: { notepads: { $in: notepadsIds } } },
        { 'new': true }
    )
);

var User = mongoose.model('User', userSchema);

module.exports = exports = User;

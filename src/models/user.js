'use strict';

//import Promise from 'bluebird';
//let mongoose = Promise.promisifyAll(require('mongoose'));
import mongoose from 'mongoose';
import uuid from 'node-uuid';

let userSchema = new mongoose.Schema({
    facebookId: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    photo: { type: String, required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    notepads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notepad' }]
});

//auto create the accessToken
userSchema.pre('validate', function (next) {
    this.accessToken = this.accessToken || uuid.v4();
    next();
});

//returns only _id
userSchema.static('getByAccessToken', accessToken =>
    User.findOne(
        { accessToken: accessToken }
    ).exec()
);

userSchema.static('fb', fbId =>
    User.findOne(
        { facebookId: fbId },
        'facebookId accessToken name photo'
    ).exec()
);

userSchema.static('getCategories', uid =>
    User.findOne(
        { _id: uid },
        'categories'
    ).exec()
);

userSchema.static('getNotepads', uid =>
    User.findOne(
        { _id: uid },
        'notepads'
    ).exec()
);

userSchema.static('addCategory', (uid, catId) =>
    User.findOneAndUpdate(
        { _id: uid },
        { $addToSet: { categories: catId } },
        { 'new': true }
    ).exec()
);

userSchema.static('addNotepad', (uid, notepadId) =>
    User.findOneAndUpdate(
        { _id: uid },
        { $addToSet: { notepads: notepadId } },
        { 'new': true }
    ).exec()
);

userSchema.static('removeCategory', (userId, categoryId) =>
    User.findOneAndUpdate(
        { _id: userId },
        { $pull: { categories: categoryId } },
        { 'new': true }
    ).exec()
);

userSchema.static('removeNotepad', (userId, notepadId) =>
    User.findOneAndUpdate(
        { _id: userId },
        { $pull: { notepads: notepadId } },
        { 'new': true }
    ).exec()
);

userSchema.static('removeNotepads', (userId, notepadsIds) =>
    User.findOneAndUpdate(
        { _id: userId },
        { $pull: { notepads: { $in: notepadsIds } } },
        { 'new': true }
    ).exec()
);

var User = mongoose.model('User', userSchema);

//module.exports = exports = User;
export default User;

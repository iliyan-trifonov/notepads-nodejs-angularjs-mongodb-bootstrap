'use strict';

var Promise = require('bluebird'),
    mongoose = Promise.promisifyAll(require('mongoose'));

var notepadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

notepadSchema.static('getByIdForUser', (notepadId, uid) =>
    Notepad.findOneAsync({ _id: notepadId, user: uid }, 'title text category')
);

notepadSchema.static('getByUserId', uid =>
    Notepad.findAsync({ user: uid }, 'title text category')
);

notepadSchema.static('updateForUserId', (notepadId, uid, data) =>
    Notepad.findOneAndUpdateAsync(
        { _id: notepadId, user: uid },
        { $set: {
            title: data.title,
            text: data.text,
            category: data.category
        } },
        { 'new': true }
    )
);

var Notepad = mongoose.model('Notepad', notepadSchema);

module.exports = exports = Notepad;

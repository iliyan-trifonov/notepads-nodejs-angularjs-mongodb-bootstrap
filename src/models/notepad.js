'use strict';

//import Promise from 'bluebird';
//let mongoose = Promise.promisifyAll(require('mongoose'));
import mongoose from 'mongoose';

let notepadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
});

notepadSchema.static('getByIdForUser', (notepadId, uid) =>
    Notepad.findOne({ _id: notepadId, user: uid }, 'title text category').exec()
);

notepadSchema.static('getByUserId', uid =>
    Notepad.find({ user: uid }, 'title text category').exec()
);

notepadSchema.static('updateForUserId', (notepadId, uid, data) =>
    Notepad.findOneAndUpdate(
        { _id: notepadId, user: uid },
        { $set: {
            title: data.title,
            text: data.text,
            category: data.category
        } },
        { 'new': true }
    ).exec()
);

var Notepad = mongoose.model('Notepad', notepadSchema);

//module.exports = exports = Notepad;
export default Notepad;

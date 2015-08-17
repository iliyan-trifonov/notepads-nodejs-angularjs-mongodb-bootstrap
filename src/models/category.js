'use strict';

//import Promise from 'bluebird';
//let mongoose = Promise.promisifyAll(require('mongoose'));
import mongoose from 'mongoose';

let categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    notepadsCount: { type: Number, 'default': 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
});

categorySchema.static('getByUserId', uid =>
    Category.find({ user: uid }, 'name notepadsCount').exec()
);

categorySchema.static('getByIdForUser', (catId, uid) =>
    Category.findOne({ _id: catId, user: uid }, 'name').exec()
);

categorySchema.static('add', (catName, uid) =>
    Category.create({
        name: catName,
        user: uid
    })
);

categorySchema.static('update', (catId, uid, name) =>
    Category.findOneAndUpdate(
        { _id: catId, user: uid },
        { $set: { name: name } },
        { 'new': true }
    ).exec()
);

categorySchema.static('increaseNotepadsCountById', catId =>
    Category.findOneAndUpdate(
        { _id: catId },
        { $inc: { notepadsCount: 1 } },
        { 'new': true }
    ).exec()
);

categorySchema.static('decreaseNotepadsCountById', catId =>
    Category.findOneAndUpdate(
        { _id: catId },
        { $inc: { notepadsCount: -1 } },
        { 'new': true }
    ).exec()
);

var Category = mongoose.model('Category', categorySchema);

//module.exports = exports = Category;
export default Category;

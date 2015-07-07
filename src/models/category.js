'use strict';

import Promise from 'bluebird';
let mongoose = Promise.promisifyAll(require('mongoose'));

let categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    notepadsCount: { type: Number, 'default': 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
});

categorySchema.static('getByUserId', uid =>
    Category.findAsync({ user: uid }, 'name notepadsCount')
);

categorySchema.static('getByIdForUser', (catId, uid) =>
    Category.findOneAsync({ _id: catId, user: uid }, 'name')
);

categorySchema.static('add', (catName, uid) =>
    Category.createAsync({
        name: catName,
        user: uid
    })
);

categorySchema.static('update', (catId, uid, name) =>
    Category.findOneAndUpdateAsync(
        { _id: catId, user: uid },
        { $set: { name: name } },
        { 'new': true }
    )
);

categorySchema.static('increaseNotepadsCountById', catId =>
    Category.findOneAndUpdateAsync(
        { _id: catId },
        { $inc: { notepadsCount: 1 } },
        { 'new': true }
    )
);

categorySchema.static('decreaseNotepadsCountById', catId =>
    Category.findOneAndUpdateAsync(
        { _id: catId },
        { $inc: { notepadsCount: -1 } },
        { 'new': true }
    )
);

var Category = mongoose.model('Category', categorySchema);

//module.exports = exports = Category;
export default Category;

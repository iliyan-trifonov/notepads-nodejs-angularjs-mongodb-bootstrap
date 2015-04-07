'use strict';

var User = require('./models/user'),
    Category = require('./models/category'),
    Notepad = require('./models/notepad');

module.exports.prepopulate = exports.prepopulate = function (uid, cb) {

    var category = new Category({
        'name': 'Sample category',
        user: uid
    });

    category.save(function (categoryErr, categoryRes) {

        if (categoryErr || !categoryRes) {
            console.log('error creating a new category!', categoryErr, categoryRes);
            return cb(categoryErr, categoryRes);
        }

        User.addCategory(uid, categoryRes._id, function (userErr, userRes) {
            if (userErr || !userRes) {
                console.log('error adding category to user!', userErr, userRes);
                return cb(userErr, userRes);
            }

            var notepad = new Notepad({
                title: 'Read me',
                text: 'Use the menu on the top left to create your own categories ' +
                        'and then add notepads to them.' + "\n\n" +
                        'On the top right of the Dashboard there is a plus sign inside a circle.' +  "\n" +
                        'Tapping on it will open the Add Notepad window.' +  "\n" +
                        'Select a category, provide a title and text and save the new notepad.' +  "\n\n" +
                        'The smaller plus signs on the right of each category\'s name will open the same ' +
                        'Add Notepad window with the category preselected.' +  "\n\n" +
                        'Click on a Notepad on the Dashboard and you will go to the View Notepad window ' +
                        'where you can read it, edit it and delete it.' +  "\n\n" +
                        'The categories are managed from their own window where you can go ' +
                        'by selecting Categories from the left menu(top left to open it).' +  "\n\n" +
                        'Be careful when deleting a category as this will delete all notepads in it.' + "\n\n",
                category: categoryRes._id,
                user: uid
            });

            notepad.save(function (notepadErr, notepadRes) {
                if (notepadErr || !notepadRes) {
                    console.log('error creating a new notepad!', notepadErr, notepadRes);
                    return cb(notepadErr, notepadRes);
                }

                Category.increaseNotepadsCountById(notepadRes.category, function (incrCount, incrCountRes) {
                    if (incrCount || !incrCountRes) {
                        //TODO: delete the notepad from above on this error
                        return cb(incrCount, incrCountRes);
                    }

                    User.addNotepad(uid, notepadRes._id, function (err, user) {
                        if (err || !user) {
                            console.log('error adding notepad to a user!', err, user);
                            return cb(err, user);
                        }

                        return cb(null, {});
                    });
                });
            });
        });

    });

};

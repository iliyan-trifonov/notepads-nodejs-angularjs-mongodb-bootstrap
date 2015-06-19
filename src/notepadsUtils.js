'use strict';

let Category = require('./models/category'),
    Notepad = require('./models/notepad'),
    Promise = require('bluebird');

import User from './models/user';

module.exports.prepopulate = exports.prepopulate = uid => {

    if (!uid) {
        return Promise.reject(new Error('Invalid user id!'));
    }

    //TODO: delete the notepad/category on any error / transaction?

    let user, category, notepad;

    return User.findOneAsync({ _id: uid })
        .then(foundUser => {
            if (!foundUser) {
                let msg = 'User not found!';
                console.error(msg);
                return Promise.reject(new Error(msg));
            }
            user = foundUser;
            return Category.createAsync({
                'name': 'Sample category',
                'user': uid
            });
        })
        .then(cat => {
            category = cat;
            return User.addCategory(user._id, cat._id);
        })
        .then(updatedUser =>
            Notepad.createAsync({
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
                category: category._id,
                user: updatedUser._id
            })
        )
        .then(notepadCreated => {
            notepad = notepadCreated;
            return User.addNotepad(user._id, notepadCreated._id);
        })
        .then(updatedUser => {
            user = updatedUser;
            return Category.increaseNotepadsCountById(category._id);
        })
        .then(cat =>
            ({
                user: user,
                category: cat,
                notepad: notepad
            })
        )
        //catch may be skipped here and errors caught later on code calling prepopulate()
        .catch(err => {
            console.error(err);
            //reject again for other catch()-es on the chain
            return Promise.reject(err);
        });
};

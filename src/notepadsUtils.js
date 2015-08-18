'use strict';

import User from './models/user';
import Category from './models/category';
import Notepad from './models/notepad';
import Promise from 'bluebird';
import co from 'co';
import HttpStatus from 'http-status';

export let prepopulate = uid => {
    let user, userOrig, category, notepad;

    return co(function* () {
        if (!uid) {
            throw new Error('Invalid user id!');
        }

        user = userOrig = yield User.findOne({ _id: uid }).exec();

        if (!user) {
            throw new Error('User not found!');
        }

        category = yield Category.create({
            'name': 'Sample category',
            'user': user._id
        });

        user = yield User.addCategory(user._id, category._id);

        notepad = yield Notepad.create({
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
            'Be careful when deleting a category as this will delete all notepads in it.' + "\n\n" +
            'Don\'t forget to check https://notepads.iliyan-trifonov.com.' + "\n" +
            'You can use the website when you\'re on your PC for even faster creation of notepads ' +
            'which you can later read on your phone.' + "\n\n",
            category: category._id,
            user: user._id
        });

        category = yield Category.increaseNotepadsCountById(category._id);

        user = yield User.addNotepad(user._id, notepad._id);

        return {
            user: user,
            category: category,
            notepad: notepad
        };
    }).catch(err => {
        //cleanup - restore code, no need to wait for it to finish:
        //TODO: test this cleanup
        if (category && category._id) {
            Category.remove({ _id: category._id });
        }

        if (notepad && notepad._id) {
            Notepad.remove({ _id: notepad._id });
        }

        if (userOrig && userOrig._id) {
            User.findOneAndUpdate(
                {_id: userOrig._id},
                {
                    $set: {
                        categories: userOrig.categories,
                        notepads: userOrig.notepads
                    }
                }
            ).exec();
        }
        //

        console.error(err);
        //reject again for other catch()-es on the chain
        return Promise.reject(err);
    });
};

//the following 2 functions modify User and Category:
export let assignNotepad = (notepadId, catId, uid) => {
    return co(function* () {
        let user = yield User.addNotepad(uid, notepadId);
        let category = yield Category.increaseNotepadsCountById(catId);

        return {
            user,
            category
        };
    });
};

export let unassignNotepad = (notepadId, catId, uid) => {
    return co(function* () {
        let user = yield User.removeNotepad(uid, notepadId);
        let category = yield Category.decreaseNotepadsCountById(catId);

        return {
            user,
            category
        };
    });
};

export let checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.error('API notepads: checkAuth(), not authenticated!');
        res.status(HttpStatus.UNAUTHORIZED).json({});
    } else {
        next();
    }
};

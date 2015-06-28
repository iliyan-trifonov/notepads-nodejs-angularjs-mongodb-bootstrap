'use strict';

import express from 'express';
import User from '../models/user';
import Category from '../models/category';
import Notepad from '../models/notepad';
import moment from 'moment';
import HttpStatus from 'http-status';
import async from 'async';
import Promise from 'bluebird';
import co from 'co';

let app = express(),
    router = express.Router();

//TODO: put this in FacebookAuth
//TODO: or make it connected somehow
//TODO: with the Facebook authentication process
let checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.error('API notepads: checkAuth(), not authenticated!');
        res.status(HttpStatus.UNAUTHORIZED).json({});
    } else {
        next();
    }
};

//protect this resource to the logged in user
//TODO: checkAuth() should be shared between all handlers/controllers
//TODO: put it in the FacebookAuth file
//TODO: or create a separate auth module
router.use(checkAuth);

//base: /notepads

// ?insidecats=1
//TODO: only next() may be needed, not next(route)
//TODO: check with/out the ?param
//TODO: and create a second route without the query string instead of the else
let insidecatsFromQueryString = () =>
    (req, res, next) => {
        let insidecats = String(req.query.insidecats);
        if (insidecats && "1" === insidecats) {
            if (!req.params) {
                req.params = {};
            }
            req.params.insidecats = insidecats;
            next();
        } else {
            next('route');
        }
    }
;

//validation
//router.param('range', /^(\w+)\.\.(\w+)?$/);

let getNotepadsHandler = (req, res) => {
    //if (req.params.insidecats) {

    let categories = [];
    let catsCache = {};

    //helper functions//////////////////////////////////////////////

    //uses the catsCache from the outer scope:
    let findCat = (cats, id) => {
        return new Promise((resolve, reject) => {
            //the category is already in the cache
            if (catsCache[id]) {
                return resolve(catsCache[id]);
            }

            //check all items in the array
            async.detect(cats, (cat, callback) => {
                //we need callback(true) at some time:
                callback(cat._id.equals(id));
            }, result => {
                //the item where we had callback(true):
                if (result) {
                    catsCache[id] = result;
                    resolve(catsCache[id]);
                } else {
                    //should never happen as categories array will always have the required cat id
                    reject();
                }
            });
        });
    };

    //uses the categories from the outer scope:
    let populateCategories = (cats) => {
        return new Promise((resolve, reject) => {
            async.eachSeries(cats, (cat, callback) => {
                categories.push({
                    _id: cat._id,
                    name: cat.name,
                    notepadsCount: cat.notepadsCount,
                    notepads: []
                });
                callback();
            }, err => {
                if (err) {
                    console.error(err);
                    reject();
                } else {
                    resolve();
                }
            });
        });
    };

    //uses the categories from the outer scope:
    let populateNotepads = (notepads) => {
        return new Promise((resolve, reject) => {

            async.eachSeries(notepads, (notepad, callback) => {

                findCat(categories, notepad.category).then(curCat => {
                    curCat.notepads.push({
                        _id: notepad._id,
                        title: notepad.title,
                        text: notepad.text,
                        created: moment(
                            notepad._id.getTimestamp())
                            .format('YYYY/MM/DD HH:mm:ss')
                    });
                    callback();
                });//findCat

            }, err => {
                if (err) {
                    console.error(err);
                    reject();
                } else {
                    resolve();
                }
            });//async

        });//Promise
    };

    ////////////////////////////////////////////////////////////////

    co(function* () {
        let cats = yield Category.getByUserId(req.user.id);

        if (!cats || cats.length === 0) {
            return res.status(HttpStatus.OK).json([]);
        }

        yield populateCategories(cats);

        let notepads = yield Notepad.getByUserId(req.user.id);

        yield populateNotepads(notepads);

        res.status(HttpStatus.OK).json(categories);
    }).catch(err => {
        console.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([]);
    });

    /*} else {
     //get user's notepads
     res.json(notepads);
     }*/
};

let getNotepadByIdHandler = (req, res) => {
    co(function* () {

        let notepad = yield Notepad.getByIdForUser(req.params.id, req.user.id);

        if (!notepad) {
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        res.status(HttpStatus.OK).json(notepad);

    }).catch(err => {
        console.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

let postNotepadsHandler = (req, res) => {
    co(function* () {

        //TODO: check for valid params and return BAD_REQUEST

        let category = yield Category.getByIdForUser(req.body.category, req.user.id);

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        let notepad = yield Notepad.createAsync({
            category: category._id,
            title: req.body.title,
            text: req.body.text,
            user: req.user.id
        });

        if (!notepad) {
            throw new Error('Could not create notepad!');
        }

        yield Category.increaseNotepadsCountById(notepad.category);

        yield User.addNotepad(notepad.user, notepad._id);

        res.status(HttpStatus.CREATED).json(notepad);

    }).catch(err => {
        console.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

let putNotepadsIdHandler = (req, res) => {
    co(function* () {
        if (!req.params.id || ! req.body.title || !req.body.text || !req.body.category) {
            return res.status(HttpStatus.BAD_REQUEST).json({});
        }

        let notepad = yield Notepad.getByIdForUser(req.params.id, req.user.id);

        if (!notepad) {
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        let oldCat = notepad.category;

        notepad = yield Notepad.updateForUserId(
            notepad._id,
            req.user.id,
            {
                title: req.body.title,
                text: req.body.text,
                category: req.body.category
            }
        );

        if (!notepad) {
            throw new Error('Error updating the notepad!');
        }

        if (String(oldCat) !== String(notepad.category)) {
            yield Category.decreaseNotepadsCountById(oldCat);
            yield Category.increaseNotepadsCountById(notepad.category);
        }

        res.status(HttpStatus.CREATED).json(notepad);
    }).catch(err => {
        console.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

let deleteNotepadsIdHandler = (req, res) => {
    co(function* () {
        let notepad = yield  Notepad.getByIdForUser(req.params.id, req.user.id);

        if (!notepad) {
            return res.status(HttpStatus.NOT_FOUND).json({});
        }

        notepad = yield Notepad.findByIdAndRemove(req.params.id);

        if (!notepad) {
            throw new Error('Could not delete the notepad!');
        }

        let user = yield User.removeNotepad(req.user.id, req.params.id);

        if (!user) {
            throw new Error('Could not remove the notepad id from user!');
        }

        let category = yield Category.decreaseNotepadsCountById(notepad.category);

        if (!category) {
            throw new Error('Could not decrease notepads count in category!');
        }

        res.status(HttpStatus.NO_CONTENT).json({});
    }).catch(err => {
        console.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
    });
};

// GET /notepads(?insidecats=1)?
router.get('/', insidecatsFromQueryString(), getNotepadsHandler);

// GET /notepads/1
router.get('/:id', getNotepadByIdHandler);

// POST /notepads
router.post('/', postNotepadsHandler);

// PUT /notepads/1
router.put('/:id', putNotepadsIdHandler);

// DELETE /notepads/1
router.delete('/:id', deleteNotepadsIdHandler);


if (app.get('env') === 'test') {
    router.checkAuth = checkAuth;
    router.insidecatsFromQueryString = insidecatsFromQueryString;
    router.getNotepadsHandler = getNotepadsHandler;
    router.getNotepadByIdHandler = getNotepadByIdHandler;
    router.postNotepadsHandler = postNotepadsHandler;
    router.putNotepadsIdHandler = putNotepadsIdHandler;
    router.deleteNotepadsIdHandler = deleteNotepadsIdHandler;
}

//module.exports = exports = router;
export default router;

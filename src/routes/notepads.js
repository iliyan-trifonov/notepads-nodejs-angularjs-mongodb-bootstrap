'use strict';

import express from 'express';
import Category from '../models/category';
import Notepad from '../models/notepad';
import { assignNotepad, unassignNotepad } from '../notepadsUtils';
import moment from 'moment';
import HttpStatus from 'http-status';
import async from 'async';
import Promise from 'bluebird';
import co from 'co';
import { checkAuth } from '../notepadsUtils';

let app = express(),
    router = express.Router();

//protect this resource to the logged in user
router.use(checkAuth);

//base: /notepads

// if ?insidecats=1
let insidecatsFromQueryString = () =>
    (req, res, next) => {
        let insidecats = String(req.query.insidecats);
        if (insidecats && "1" === insidecats) {
            if (!req.params) {
                req.params = {};
            }
            req.params.insidecats = insidecats;
        }
        next();
    }
;

//validation
//router.param('range', /^(\w+)\.\.(\w+)?$/);

let getNotepadsHandler = (req, res) => {
    //put all notepads in categories:
    if (req.params.insidecats === "1") {
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
    } else {
        //get all user's notepads
        co(function* () {
            let notepads = yield Notepad.getByUserId(req.user.id);
            if (!notepads || !Array.isArray(notepads) || notepads.length === 0) {
                return res.status(HttpStatus.NOT_FOUND).json([]);
            }

            res.status(HttpStatus.OK).json(notepads);
        });
    }
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

        let category = yield Category.getByIdForUser(req.body.category, req.user.id);

        if (!category || !req.body.title || !req.body.text) {
            return res.status(HttpStatus.BAD_REQUEST).json({});
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

        yield assignNotepad(notepad._id, notepad.category, notepad.user);

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

        yield unassignNotepad(notepad._id, notepad.category, notepad.user);

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

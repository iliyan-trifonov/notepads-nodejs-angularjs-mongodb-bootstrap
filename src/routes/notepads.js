'use strict';

var express = require('express'),
    app = express(),
    router = express.Router(),
    User = require('../models/user'),
    Category = require('../models/category'),
    Notepad = require('../models/notepad'),
    moment = require('moment'),
    HttpStatus = require('http-status'),
    Promise = require('bluebird');

//TODO: put this in FacebookAuth
//TODO: or make it connected somehow
//TODO: with the Facebook authentication process
function checkAuth(req, res, next) {
    if (!req.isAuthenticated()) {
        console.error('API cats: checkAuth(), not authenticated!');
        res.status(HttpStatus.UNAUTHORIZED).json({});
    } else {
        next();
    }
}

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
function insidecatsFromQueryString() {
    return function (req, res, next) {
        var insidecats = String(req.query.insidecats);
        if (insidecats && "1" === insidecats) {
            req.params.insidecats = insidecats;
            next();
        } else {
            next('route');
        }
    };
}

//validation
//router.param('range', /^(\w+)\.\.(\w+)?$/);

var getNotepadsHandler = function (req, res) {
    if (!req.user || !req.user.id) {
        return res.status(HttpStatus.FORBIDDEN).json([]);
    }

    //if (req.params.insidecats) {

    var categories = [];
    var catsCache = {};

    function findCat(cats, id) {
        if ("undefined" !== typeof catsCache[id]) {
            return catsCache[id];
        }
        cats.forEach(function (cat) {
            if (cat._id.toString() === id.toString()) {
                catsCache[id] = cat;
                return false;
            }
        });
        return catsCache[id];
    }

    //get the categories
    Category.getByUserId(req.user.id)
        .then(function (cats) {
            if (!cats) {
                return Promise.reject(new Error('No categories found!'));
            }

            cats.forEach(function (cat) {
                categories.push({
                    _id: cat._id,
                    name: cat.name,
                    notepadsCount: cat.notepadsCount,
                    notepads: []
                });
            });

            //and then get the notepads
            return Notepad.getByUserId(req.user.id);
        })
        .then(function (notepads) {
            var curCat;
            notepads.forEach(function (notepad) {
                curCat = findCat(categories, notepad.category);
                curCat.notepads.push({
                    _id: notepad._id,
                    title: notepad.title,
                    text: notepad.text,
                    created: moment(
                        notepad._id.getTimestamp())
                        .format('YYYY/MM/DD HH:mm:ss')
                });
            });
            res.status(HttpStatus.OK).json(categories);
        })
        .catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
    /*} else {
     //get user's notepads
     res.json(notepads);
     }*/
};

var getNotepadByIdHandler = function (req, res) {
    //TODO: check id validity, belongs to the current user, etc.
    Notepad.getByIdForUser(req.params.id, req.user.id)
        .then(function (notepad) {
            if (!notepad) {
                //TODO: return empty set status
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
            }
            res.status(HttpStatus.OK).json(notepad);
        })
        .catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var postNotepadsHandler = function (req, res) {
    //TODO: check for empty or invalid values: req.body.title/text/category
    var notepad;
    Category.getByIdForUser(req.body.category, req.user.id)
        .then(function (category) {
            if (!category) {
                res.status(HttpStatus.NO_CONTENT).json({});
                return Promise.reject(new Error('Category not found!'));
            }

            return Notepad.createAsync({
                category: req.body.category,
                title: req.body.title,
                text: req.body.text,
                user: req.user.id
            });
        })
        .then(function (note) {
            //TODO: check if note is valid
            notepad = note;
            return Category.increaseNotepadsCountById(notepad.category);
        })
        .then(function (/*category*/) {
            //TODO: check if category is valid
            return User.addNotepad(req.user.id, notepad._id);
        })
        .then(function (/*user*/) {
            //TODO: check if user is valid
            return res.status(HttpStatus.OK).json(notepad);
        })
        .catch(function (err) {
            console.error(err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var putNotepadsIdHandler = function (req, res) {
    //TODO: check id and notepad props validity: req.body.*
    var oldCat, newCat, notepadNew;
    Notepad.getByIdForUser(req.params.id, req.user.id)
        .then(function (notepad) {
            //TODO: check err/null notepad and return empty res status
            oldCat = notepad.category;
            newCat = req.body.category;
            return Notepad.findOneAndUpdateAsync(
                { _id: notepad._id },
                {$set: {
                    title: req.body.title,
                    text: req.body.text,
                    category: req.body.category
                }}
            );
        }).then(function (notepad) {
            //TODO: check err / notepad === null
            notepadNew = notepad;
            //update categories notepads' numbers if cat is changed
            if (String(newCat) !== String(oldCat)) {
                return Category.decreaseNotepadsCountById(oldCat)
                    .then(function (/*cat*/) {
                        return Category.increaseNotepadsCountById(newCat);
                    });
            }
        }).then(function (/*cat*/) {
            //TODO: if err / category === null
            res.status(HttpStatus.OK).json(notepadNew);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var deleteNotepadsIdHandler = function (req, res) {
    //TODO: check for valid id: exists/is ObjectID/etc.
    var notepad;
    Notepad.getByIdForUser(req.params.id, req.user.id).then(function (notepad) {
        if (!notepad) {
            return res.status(HttpStatus.NO_CONTENT).json({});
        }
        return Notepad.findByIdAndRemove(req.params.id);
    }).then(function (note) {
        //TODO: check if err / notepad === null - missing
        notepad = note;
        return User.findOneAndUpdateAsync({ notepads: req.params.id }, {
            $pull: { notepads: req.params.id }
        });
    }).then(function (user) {
        if (!user) {
            return res.status(HttpStatus.NO_CONTENT).json({});
        }
        return Category.decreaseNotepadsCountById(notepad.category);
    }).then(function (category) {
        if (!category) {
            return res.status(HttpStatus.NO_CONTENT).json({});
        }
        //success
        res.status(HttpStatus.OK).json(notepad);
    }).catch(function (err) {
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

module.exports = exports = router;

if (app.get('env') === 'test') {
    module.exports.getNotepadsHandler = exports.getNotepadsHandler = getNotepadsHandler;
    module.exports.getNotepadByIdHandler = exports.getNotepadByIdHandler = getNotepadByIdHandler;
    module.exports.postNotepadsHandler = exports.postNotepadsHandler = postNotepadsHandler;
    module.exports.putNotepadsIdHandler = exports.putNotepadsIdHandler = putNotepadsIdHandler;
    module.exports.deleteNotepadsIdHandler = exports.deleteNotepadsIdHandler = deleteNotepadsIdHandler;
}

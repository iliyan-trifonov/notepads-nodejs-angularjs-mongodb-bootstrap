'use strict';

var express = require('express'),
    app = express(),
    router = express.Router(),
    User = require('../models/user'),
    Category = require('../models/category'),
    Notepad = require('../models/notepad'),
    moment = require('moment'),
    HttpStatus = require('http-status');

//TODO: put this in FacebookAuth
//TODO: or make it connected somehow
//TODO: with the Facebook authentication process
function checkAuth(req, res, next) {
    if (!req.isAuthenticated()) {
        console.error('API notepads: checkAuth(), not authenticated!');
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
            if (!req.params) {
                req.params = {};
            }
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
    var p = Category.getByUserId(req.user.id)
        .then(function (cats) {
            if (!cats || cats.length === 0) {
                res.status(HttpStatus.OK).json([]);
                return p.cancel();
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
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([]);
        });
    /*} else {
     //get user's notepads
     res.json(notepads);
     }*/
};

var getNotepadByIdHandler = function (req, res) {
    Notepad.getByIdForUser(req.params.id, req.user.id)
        .then(function (notepad) {
            if (!notepad) {
                return res.status(HttpStatus.NO_CONTENT).json({});
            }
            res.status(HttpStatus.OK).json(notepad);
        })
        .catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var postNotepadsHandler = function (req, res) {
    var notepad;
    var p = Category.getByIdForUser(req.body.category, req.user.id)
        .then(function (category) {
            if (!category) {
                res.status(HttpStatus.NO_CONTENT).json({});
                return p.cancel();
            }

            //TODO: add checking for the required params and return BAD_REQUEST
            return Notepad.createAsync({
                category: req.body.category,
                title: req.body.title,
                text: req.body.text,
                user: req.user.id
            });
        })
        .then(function (note) {
            if (!note) {
                throw new Error('Could not create notepad!');
            }
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
    if (!req.params.id || ! req.body.title || !req.body.text || !req.body.category) {
        return res.status(HttpStatus.BAD_REQUEST).json({});
    }

    var oldCat, newCat, notepadNew;
    var p = Notepad.getByIdForUser(req.params.id, req.user.id)
        .then(function (notepad) {
            if (!notepad) {
                res.status(HttpStatus.NO_CONTENT).json({});
                return p.cancel();
            }

            oldCat = notepad.category;
            newCat = req.body.category;

            return Notepad.updateForUserId(
                notepad._id,
                req.user.id,
                {
                    title: req.body.title,
                    text: req.body.text,
                    category: req.body.category
                }
            );
        }).then(function (notepad) {
            if (!notepad) {
                throw new Error('Error updating the notepad!');
            }

            notepadNew = notepad;
            //update categories notepads' numbers if cat is changed
            if (String(newCat) !== String(oldCat)) {
                return Category.decreaseNotepadsCountById(oldCat).then(function (/*cat*/) {
                    return Category.increaseNotepadsCountById(newCat);
                });
            }
        }).then(function (/*cat*/) {
            res.status(HttpStatus.OK).json(notepadNew);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var deleteNotepadsIdHandler = function (req, res) {
    var notepad;
    var p = Notepad.getByIdForUser(req.params.id, req.user.id).then(function (notepad) {
        if (!notepad) {
            res.status(HttpStatus.NO_CONTENT).json({});
            return p.cancel();
        }
        return Notepad.findByIdAndRemove(req.params.id);
    }).then(function (note) {
        if (!note) {
            throw new Error('Could not delete the notepad!');
        }
        notepad = note;
        return User.removeNotepad(req.user.id, req.params.id);
    }).then(function (user) {
        if (!user) {
            throw new Error('Could not remove the notepad id from user!');
        }
        return Category.decreaseNotepadsCountById(notepad.category);
    }).then(function (category) {
        if (!category) {
            throw new Error('Could not decrease notepads count in category!');
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
    module.exports.checkAuth = exports.checkAuth = checkAuth;
    module.exports.insidecatsFromQueryString = exports.insidecatsFromQueryString = insidecatsFromQueryString;
    module.exports.getNotepadsHandler = exports.getNotepadsHandler = getNotepadsHandler;
    module.exports.getNotepadByIdHandler = exports.getNotepadByIdHandler = getNotepadByIdHandler;
    module.exports.postNotepadsHandler = exports.postNotepadsHandler = postNotepadsHandler;
    module.exports.putNotepadsIdHandler = exports.putNotepadsIdHandler = putNotepadsIdHandler;
    module.exports.deleteNotepadsIdHandler = exports.deleteNotepadsIdHandler = deleteNotepadsIdHandler;
}

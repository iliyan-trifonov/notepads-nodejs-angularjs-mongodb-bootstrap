'use strict';

var express = require('express'),
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
        console.log('API cats: checkAuth(), not authenticated!');
        res.status(403).send('Unauthorized');
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

// GET /notepads(?insidecats=1)?
//TODO: make it with less DB calls!!!
router.get('/', insidecatsFromQueryString(), function (req, res) {
    //if (req.params.insidecats) {
            //get the categories
            Category.getByUserId(req.user._id, function (err, cats) {
                var categories = [];
                //TODO: if err / cats === null , empty
                cats.forEach(function (cat) {
                    categories.push({
                        _id: cat._id,
                        name: cat.name,
                        notepadsCount: cat.notepadsCount,
                        notepads: []
                    });
                });

                //TODO: catsCache[] instead:
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

                Notepad.getByUserId(req.user._id, function (err, notepads) {
                    //TODO: if err / notepads === null
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
                    return res.json(categories);
                });
        });
    /*} else {
        //get user's notepads' ObjectIds
        User.findOne({ _id: req.user.id }, 'notepads', function (err, user) {
            //TODO: if err
            //get the notepads data by these ObjectIds
            Notepad.find({ _id: { $in: user.notepads }}, function (err, notepads) {
                //TODO: if err
                //TODO: empty status
                res.json(notepads);
            });
        });
    }*/
});

// GET /notepads/1
router.get('/:id', function (req, res) {
    //TODO: check id validity, belongs to the current user, etc.
    Notepad.getByIdForUser(req.params.id, req.user.id, function (err, notepad) {
        if (err) {
            return res.status(500).json(err);
        }
        if (!notepad) {
            //TODO: return empty set status
            return res.status(500).json({});
        }
        return res.json(notepad);
    });
});

// POST /notepads
router.post('/', function (req, res) {
    //TODO: check for empty or invalid values
    //TODO: create a common checkCatBelongsTo() function to use everywhere here
    Category.getByIdForUser(req.body.category, req.user.id, function (err, category) {

        if (err) {
            return res.status(500).json(err);
        }
        if (!category) {
            return res.status(500).json('Unknown category!');
        }

        var notepad = new Notepad({
            category: req.body.category,
            title: req.body.title,
            text: req.body.text,
            user: req.user.id
        });

        notepad.save(function (err, notepad) {
            User.addNotepad(req.user.id, notepad, function (err, user) {
                if (err) {
                    return res.status(500).json(err);
                }
                if (!user) {
                    return res.status(500).json('Error assigning the notepad to the user!');
                }
                Category.increaseNotepadsCountById(notepad.category, function (err, category) {
                    if (err) {
                        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
                    }
                    if (!category) {
                        return res.status(HttpStatus.NO_CONTENT).json({});
                    }
                    return res.json(notepad);
                });
            });
        });

    });
});

// PUT /notepads/1
router.put('/:id', function (req, res) {
    console.log('updating a Notepad');
    //TODO: check id and notepad props validity, belongs to user, etc.
    //TODO: check if cat belongs to the user: create a common function for that
    Notepad.getByIdForUser(req.params.id, req.user.id, function (err, notepad) {
        //TODO: check err/null notepad and return empty res status
        console.log('found a notepad for user', req.params.id, notepad, req.user.id);
        var oldCat = notepad.category;
        var newCat = req.body.category;
        Notepad.findOneAndUpdate(
            { _id: notepad._id },
            {$set: {
                title: req.body.title,
                text: req.body.text,
                category: req.body.category
            }},
            {},
            function (err, notepadNew) {
                //TODO: check err / notepad === null
                console.log('Notepad updated', notepadNew);
                if (String(newCat) !== String(oldCat)) {
                    Category.decreaseNotepadsCountById(oldCat, function (err, catOld) {
                        //TODO: if err / category === null
                        console.log('category Notepads count decreased', catOld);
                        Category.increaseNotepadsCountById(newCat, function (err, catNew) {
                            //TODO: if err / category === null
                            console.log('category Notepads count increased', catNew);
                            return res.status(200).json(notepadNew);
                        });
                    });
                } else {
                    return res.status(200).json(notepadNew);
                }
            }
        );
    });
});

// DELETE /notepads/1
router.delete('/:id', function (req, res) {
    //TODO: check for valid id: exists/is ObjectID/etc.
    Notepad.getByIdForUser(req.params.id, req.user.id, function (err, notepad) {

        if (err) {
            return res.status(500).json(err);
        }
        if (!notepad) {
            //TODO: return the proper status code
            return res.status(500).json('Notepad not found!');
        }

        Notepad.findByIdAndRemove(req.params.id, function (err, notepad) {
            //TODO: check if err / notepad === null - missing
            console.log('notepad removed:', notepad);
            //finds user by notepad._id looking into user.notepads[]
            User.findOneAndUpdate({ notepads: req.params.id }, {
                $pull: { notepads: req.params.id }
            }, function (err, user) {
                if (err) {
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
                }
                if (!user) {
                    return res.status(HttpStatus.NO_CONTENT).json({});
                }
                console.info('notepad removed from the user');
                Category.decreaseNotepadsCountById(notepad.category, function (err, category) {
                    if (err) {
                        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
                    }
                    if (!category) {
                        return res.status(HttpStatus.NO_CONTENT).json({});
                    }
                    console.log('category notepadsCount decreased');
                    return res.status(200).json(notepad);
                });
            });
        });

    });
});

module.exports = router;

'use strict';

var express = require('express'),
    app = express(),
    router = express.Router(),
    FacebookAuth = require('../FacebookAuth'),
    User = require('../models/user'),
    Category = require('../models/category'),
    Notepad = require('../models/notepad'),
    HttpStatus = require('http-status'),
    _ = require('lodash');

//protect this resource to the logged in user
//TODO: return API error, not redirecting to the home page!!!
//TODO: like: if GET token/or req.user, skip this:
router.use(FacebookAuth.verifyAuth);

//handlers start
var getHandler = function (req, res) {
    //get the categories by user id
    //TODO: check if req.user._id/req.user.id exists
    Category.getByUserId(req.user._id, function (err, categories) {
        if (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json('Cannot get category by user id!');
        }
        if (!categories) {
            return res.status(HttpStatus.NO_CONTENT)
                .json({});
        }
        return res.status(HttpStatus.OK)
            .json(categories);
    });
};

var postHandler = function (req, res) {
    //TODO: check if name is given and is clean
    var category = new Category({
        name: req.body.name,
        user: req.user._id
    });
    category.save(function (err, category) {
        if (err || !category) {
            console.error(err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Could not save category!');
        }
        User.addCategory(req.user._id, category._id, function (err, user) {
            if (err || !user) {
                console.error(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Could not assign category to user!');
            }
            return res.status(HttpStatus.OK).json(category);
        });
    });
};

var getIdHandler = function (req, res) {
    Category.getByIdForUser(req.params.id, req.user.id, function (err, category) {
        if (err) {
            console.error(err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
        if (!category) {
            console.error('getIdHandler(): Category not found!');
            return res.status(HttpStatus.NO_CONTENT).json({});
        }
        return res.status(HttpStatus.OK).json(category);
    });
};

var putIdHandler = function (req, res) {
    //TODO: check id, name allowed chars, etc.
    //TODO: use a model function for this: Category.updateCategory(id, uid, newName)
    Category.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        {$set: {name: req.body.name}},
        { 'new': true },
        function (err, category) {
            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json('putIdHandler(): Could not update Category!');
            }
            if (!category) {
                return res.status(HttpStatus.NO_CONTENT).json({});
            }
            return res.status(HttpStatus.OK).json(category);
        }
    );
};

var deleteIdHandler = function (req, res) {
    Category.getByIdForUser(req.params.id, req.user.id, function (err, category) {
        if (err) {
            console.error(err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }

        if (!category) {
            console.error('Category not found for user!');
            return res.status(HttpStatus.NO_CONTENT).json({});
        }

        Category.findByIdAndRemove(req.params.id, function (err, category) {
            if (err) {
                console.error(err);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
            }
            if (!category) {
                console.error('Category not found!');
                return res.status(HttpStatus.NO_CONTENT).json({});
            }

            console.log('deleteIdHandler(): deleted category', category);

            User.removeCategory(req.user.id, req.params.id, function (err, user) {
                if (err) {
                    console.error(err);
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .json('Could not remove category from user!');
                }
                if (!user) {
                    console.error('User with that category not found!');
                    return res.status(HttpStatus.NO_CONTENT).json({});
                }

                console.log('deleteIdHandler(): user with category removed', user);

                //delete all orphaned notepads(if any) belonging to the deleted category
                //TODO: put the notepads in Uncategorized category instead
                //TODO: check if Notepad.remove() returns the removed documents to use it directly
                Notepad.find({ user: req.user.id, category: req.params.id }, function (err, notepads) {
                    if (err) {
                        return res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .json('Could not find notepads of category to remove!');
                    }
                    if (notepads) {
                        var ns = _.pluck(notepads, '_id');
                        console.log('deleteIdHandler(): notepads to be deleted for category', ns);
                        Notepad.remove({
                            _id: { $in: ns }
                        }, function (err) {
                            if (err) {
                                return res.status(500).json('Could not remove notepads of a deleted category!');
                            }

                            //remove the notepads' ids from User.notepads too
                            User.findOneAndUpdate({ _id: user._id },
                                { $pull: { notepads: { $in: ns } } },
                                { 'new': true },
                                function (err, user) {
                                    if (err) {
                                        console.error(err);
                                        return res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                            .json('Could not remove notepads\'s ids from user for a deleted category!');
                                    }
                                    console.log('deleteIdHandler(): user with removed notepads for category', user);
                                    return res.status(HttpStatus.OK).json(category);
                                });
                        });
                    } else {
                        return res.status(HttpStatus.OK).json(category);
                    }
                });
            });
        });
    });
};
//handlers end

//base: /categories

// GET /categories
router.get('/', getHandler);

// POST /categories
router.post('/', postHandler);

// GET /categories/1234
router.get('/:id', getIdHandler);

// PUT /categories/1234
router.put('/:id', putIdHandler);

// DELETE /categories/1
router.delete('/:id', deleteIdHandler);

module.exports = exports = router;

if (app.get('env') === 'test') {
    console.log('exporting the handlers');
    module.exports.getHandler = exports.getHandler = getHandler;
    module.exports.postHandler = exports.postHandler = postHandler;
    module.exports.getIdHandler = exports.getIdHandler = getIdHandler;
    module.exports.putIdHandler = exports.putIdHandler = putIdHandler;
    module.exports.deleteIdHandler = exports.deleteIdHandler = deleteIdHandler;
}

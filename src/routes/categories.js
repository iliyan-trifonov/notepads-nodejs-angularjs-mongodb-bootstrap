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
    Category.getByUserId(req.user._id)
        .then(function (categories) {
            if (!categories) {
                var msg = 'Categories not found!';
                throw new Error(msg);
            }
            res.status(HttpStatus.OK).json(categories);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var postHandler = function (req, res) {
    //TODO: check if name param is given and is clean
    var category = new Category({
        name: req.body.name,
        user: req.user._id
    });
    var savedCat;
    category.saveAsync()
        .then(function (params) {
            savedCat = params[0];
            return User.addCategory(req.user._id, savedCat._id);
        }).then(function (/*user*/) {
            res.status(HttpStatus.OK).json(savedCat);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

var getIdHandler = function (req, res) {
    Category.getByIdForUser(req.params.id, req.user.id)
        .then(function (category) {
            if (!category) {
                var msg = 'getIdHandler(): Category not found!';
                console.error(msg);
                //throw new Error(msg);
                return res.status(HttpStatus.NO_CONTENT).json({});
            }
            res.status(HttpStatus.OK).json(category);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
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
    var ns, category;
    //check if the current user has that Category
    var p = Category.getByIdForUser(req.params.id, req.user.id)
        .then(function (cat) {
            if (!cat) {
                console.error('Category not found for user!');
                res.status(HttpStatus.NO_CONTENT).json({});
                return p.cancel();
            }
            category = cat;
            return Category.findByIdAndRemoveAsync(category._id);
        })/*.cancelable()*/
        .then(function (cat) {
            if (!cat) {
                console.error('Category not found!');
                return res.status(HttpStatus.NO_CONTENT).json({});
            }

            console.log('deleteIdHandler(): deleted category', cat);

            return User.removeCategory(req.user.id, category._id);
        })
        .then(function (user) {
            if (!user) {
                console.error('User with that category not found!');
                return res.status(HttpStatus.NO_CONTENT).json({});
            }

            console.log('deleteIdHandler(): user doc with the specified category removed', user);

            //delete all orphaned notepads(if any) belonging to the deleted category
            //TODO: put the notepads in Uncategorized category instead
            //TODO: check if Notepad.remove() returns the removed documents to use it directly
            return Notepad.findAsync({ user: req.user.id, category: category._id });
        })
        .then(function (notepads) {
            if (notepads) {
                ns = _.pluck(notepads, '_id');
                return Notepad.removeAsync({ _id: { $in: ns } });
            }
        })
        .then(function () {
            if (ns) {
                //remove the notepads' ids from User.notepads too
                return User.removeNotepads(req.user.id, ns);
            }
        })
        .then(function (user) {
            console.log('deleteIdHandler(): user doc with removed notepads for the specified category', user);
            return res.status(HttpStatus.OK).json(category);
        })
        .catch(function (err) {
            console.error(err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
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

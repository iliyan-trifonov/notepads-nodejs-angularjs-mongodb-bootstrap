'use strict';

let express = require('express'),
    app = express(),
    router = express.Router(),
    User = require('../models/user'),
    Category = require('../models/category'),
    Notepad = require('../models/notepad'),
    HttpStatus = require('http-status'),
    _ = require('lodash');

//TODO: repeats with the same code in the notepads router!!
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


//handlers start

/**
 *
 * @param req
 * @param res
 */
let getHandler = function (req, res) {
    Category.getByUserId(req.user.id)
        .then(categories => {
            res.status(HttpStatus.OK).json(categories);
        }).catch(err => {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([]);
        });
};

/**
 *
 * @param req
 * @param res
 */
let postHandler = function (req, res) {
    if (!req.body.name) {
        return res.status(HttpStatus.BAD_REQUEST).json({});
    }

    let savedCat;
    Category.add(req.body.name, req.user.id)
        .then(function (cat) {
            savedCat = cat;
            return User.addCategory(cat.user, cat._id);
        }).then(function (/*user*/) {
            res.status(HttpStatus.OK).json(savedCat);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

let getIdHandler = function (req, res) {
    if (!req.params.id) {
        return res.status(HttpStatus.BAD_REQUEST).json({});
    }

    Category.getByIdForUser(req.params.id, req.user.id)
        .then(function (category) {
            if (!category) {
                let msg = 'getIdHandler(): Category not found!';
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

let putIdHandler = function (req, res) {
    if (!req.params.id || !req.body.name) {
        return res.status(HttpStatus.BAD_REQUEST).json({});
    }

    Category.update(req.params.id, req.user.id, req.body.name)
        .then(function (category) {
            if (!category) {
                return res.status(HttpStatus.NO_CONTENT).json({});
            }
            res.status(HttpStatus.OK).json(category);
        }).catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
        });
};

let deleteIdHandler = function (req, res) {
    let ns, category;
    //check if the current user has that Category
    let p = Category.getByIdForUser(req.params.id, req.user.id)
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
                res.status(HttpStatus.NO_CONTENT).json({});
                return p.cancel();
            }

            return User.removeCategory(req.user.id, category._id);
        })
        .then(function (user) {
            if (!user) {
                throw new Error('User with that category not found!');
            }

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
        .then(function (/*user*/) {
            return res.status(HttpStatus.OK).json(category);
        })
        .catch(function (err) {
            console.error(err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({});
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
    module.exports.getHandler = exports.getHandler = getHandler;
    module.exports.postHandler = exports.postHandler = postHandler;
    module.exports.getIdHandler = exports.getIdHandler = getIdHandler;
    module.exports.putIdHandler = exports.putIdHandler = putIdHandler;
    module.exports.deleteIdHandler = exports.deleteIdHandler = deleteIdHandler;
}

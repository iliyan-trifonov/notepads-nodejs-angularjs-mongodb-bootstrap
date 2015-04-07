'use strict';

var express = require('express'),
    router = express.Router(),
    FacebookAuth = require('../FacebookAuth'),
    User = require('../models/user'),
    Category = require('../models/category'),
    Notepad = require('../models/notepad');

//protect this resource to the logged in user
//TODO: return API error not redirect to the home page!!!
router.use(FacebookAuth.verifyAuth);

//base: /categories

// GET /categories
router.get('/', function (req, res) {
    //get the categories by user id
    Category.getByUserId(req.user._id, function (err, categories) {
        //TODO: if err / categories === null
        //TODO: empty status
        res.json(categories);
    });
});

// POST /categories
router.post('/', function (req, res) {
    //TODO: check if name is given and is clean
    var category = new Category({
        name: req.body.name,
        user: req.user._id
    });
    category.save(function (err, category) {
        //TODO: if err / category === null
        User.addCategory(req.user._id, category._id, function (err, user) {
            //TODO: if err / user === null
            res.json(category);
        });
    });
});

router.get('/:id', function (req, res) {
    //TODO: check for valid id, belongs to the current user, etc.
    Category.getByIdForUser(req.params.id, req.user.id, function (err, category) {
        //TODO: check for error, !category
        return res.status(200).json(category);
    });
});

router.put('/:id', function (req, res) {
    //TODO: check id, name allowed chars, etc.
    //TODO: use a model function for this: Category.updateCategory(id, uid, newName)
    Category.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        {$set: {name: req.body.name}},
        {},
        function (err, category) {
            //TODO: if err / category === null
            return res.status(200).json(category);
        }
    );
});

// DELETE /categories/1
router.delete('/:id', function (req, res) {
    //TODO: check for valid id and belonging to the current user
    Category.getByIdForUser(req.params.id, req.user.id, function (err, category) {

        if (err) {
            return res.status(500).json(err);
        }

        if (!category) {
            return res.status(500).json('Could not find category!');
        }

        //TODO: it should be better if used only one call including the cat id and user id
        Category.findByIdAndRemove(req.params.id, function (err, category) {
            if (err) {
                return res.status(500).json(err);
            }
            if (!category) {
                return res.status(500).json('Category not found!');
            }
            //finds user by category._id looking into user.categories[]
            User.findOneAndUpdate({ categories: req.params.id }, {
                $pull: { categories: req.params.id }
            }, function (err, user) {
                if (err) {
                    return res.status(500).json(err);
                }
                if (!user) {
                    return res.status(500).json('Category not found for user!');
                }
                //delete all orphaned notepads belonging to the deleted category
                Notepad.remove({ category: req.params.id }, function (err, data) {
                    //TODO: check if err / data === null - missing/not found?
                    return res.status(200).json(category);
                });
            });
        });

    });
});

module.exports = exports = router;

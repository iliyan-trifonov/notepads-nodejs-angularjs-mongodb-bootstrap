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
    Category.getById(req.params.id, function (err, category) {
        res.json(category);
    });
});

router.put('/:id', function (req, res) {
    //TODO: check id, name allowed chars, belongs to user, etc.
    //res.send(500, {error: err})
    //TODO: use a model function for this
    Category.findOneAndUpdate(
        { _id: req.params.id },
        {$set: {name: req.body.name}},
        {},
        function (err, category) {
            //TODO: if err / category === null
            res.json(category);
        }
    );
});

// DELETE /categories/1
router.delete('/:id', function (req, res) {
    //TODO: check for valid id and belonging to the current user
    Category.findByIdAndRemove(req.params.id, function (err, category) {
        //TODO: check if err / category === null - missing
        //finds user by category._id looking into user.categories[]
        User.findOneAndUpdate({ categories: req.params.id }, {
            $pull: { categories: req.params.id }
        }, function (err, user) {
            //TODO: check if err / user === null, etc.
            //delete all orphaned notepads belonging to the deleted category
            Notepad.remove({ category: req.params.id }, function (err, data) {
                //TODO: check if err / data === null - missing/not found?
                res.json(category);
            });
        });
    });
});

module.exports = exports = router;

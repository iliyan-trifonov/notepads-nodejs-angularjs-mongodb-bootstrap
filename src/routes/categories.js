'use strict';

var express = require('express'),
    router = express.Router(),
    FacebookAuth = require('../FacebookAuth'),
    User = require('../models/user'),
    Category = require('../models/category');

//protect this resource to the logged in user
router.use(FacebookAuth.verifyAuth);

//base: /categories

// GET /categories
router.get('/', function (req, res) {
    //get user's categories' ObjectIds
    User.findOne({ _id: req.user.id }, 'categories', function (err, user) {
        //TODO: if err
        //get the categories data by these ObjectIds
        Category.find({ _id: { $in: user.categories }}, function (err, categories) {
            //TODO: if err / categories === null
            //TODO: empty status
            res.json(categories);
        });
    });
});

// POST /categories
router.post('/', function (req, res) {
    //TODO: check if name is given and is clean
    var category = new Category({
        name: req.body.name
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

module.exports = exports = router;

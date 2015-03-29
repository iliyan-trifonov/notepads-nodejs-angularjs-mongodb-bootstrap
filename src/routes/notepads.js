'use strict';

var express = require('express'),
    router = express.Router(),
    FacebookAuth = require('../FacebookAuth'),
    User = require('../models/user'),
    Category = require('../models/category'),
    Notepad = require('../models/notepad'),
    moment = require('moment');

//protect this resource to the logged in user
router.use(FacebookAuth.verifyAuth);

//base: /notepads

// ?insidecats=1
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
        //get user's categories' and notepads' ObjectIds
        User.findOne({_id: req.user.id}, 'categories', function (err, user) {
            //TODO: if err / user === null
            var categories = [];
            //get the categories data
            Category.find({_id: {$in: user.categories}}, 'name', function (err, cats) {
                //TODO: if err / categories === null , empty
                cats.forEach(function (cat) {
                    categories.push({
                        _id: cat._id,
                        name: cat.name,
                        notepads: []
                    });
                });
                Notepad.find({category: {$in: user.categories}}, function (err, notepads) {
                    //TODO: if err / notepads === null
                    notepads.forEach(function (notepad) {
                        categories.forEach(function (cat, index) {
                            if (cat._id.toString() === notepad.category.toString()) {
                                if(!("notepads" in categories[index])) {
                                    categories[index].notepads = [];
                                }
                                categories[index].notepads.push({
                                    _id: notepad._id,
                                    title: notepad.title,
                                    text: notepad.text,
                                    created: moment(
                                        notepad._id.getTimestamp())
                                            .format('YYYY/MM/DD HH:mm:ss')
                                });
                                //break
                            }
                        });
                    });
                    res.json(categories);
                });
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
    Notepad.getById(req.params.id, function (err, notepad) {
        //TODO: check err / notepad === null
        res.json(notepad);
    });
});

// POST /notepads
router.post('/', function (req, res) {
    //TODO: check values and if they belong to the user
    var notepad = new Notepad({
        category: req.body.category,
        title: req.body.title,
        text: req.body.text
    });
    notepad.save(function (err, notepad) {
        User.addNotepad(req.user.id, notepad, function (err, user) {
            //TODO: err / user === null
            res.json(notepad);
        });
    });
});

// PUT /notepads/1
router.put('/:id', function (req, res) {
    //TODO: check id and notepad props validity, belongs to user, etc.
    Notepad.findOneAndUpdate(
        { _id: req.params.id },
        {$set: {
            title: req.body.title,
            text: req.body.text,
            category: req.body.category
        }},
        {},
        function (err, notepad) {
            //TODO: check err / notepad === null
            res.json(notepad);
        }
    );
});

module.exports = router;

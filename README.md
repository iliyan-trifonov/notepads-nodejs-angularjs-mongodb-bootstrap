### Notepads App built with NodeJS, ExpressJS, MongoDB, AngularJS and Bootstrap. Multiuser application that works with multiple Notepads in different Categories.

[![Build Status](https://travis-ci.org/iliyan-trifonov/notepads-nodejs-angularjs-mongodb-bootstrap.svg)](https://travis-ci.org/iliyan-trifonov/notepads-nodejs-angularjs-mongodb-bootstrap)
[![Coverage Status](https://coveralls.io/repos/iliyan-trifonov/notepads-nodejs-angularjs-mongodb-bootstrap/badge.svg?branch=master)](https://coveralls.io/r/iliyan-trifonov/notepads-nodejs-angularjs-mongodb-bootstrap?branch=master)
[![codecov.io](http://codecov.io/github/iliyan-trifonov/notepads-nodejs-angularjs-mongodb-bootstrap/coverage.svg?branch=master)](http://codecov.io/github/iliyan-trifonov/notepads-nodejs-angularjs-mongodb-bootstrap?branch=master)

[![Dependency Status](https://www.versioneye.com/user/projects/553a42bb1d2989cb7800010c/badge.svg?style=flat)](https://www.versioneye.com/user/projects/553a42bb1d2989cb7800010c)
[![Dependency Status](https://www.versioneye.com/user/projects/553a42b71d2989bdd500009a/badge.svg?style=flat)](https://www.versioneye.com/user/projects/553a42b71d2989bdd500009a)

[See it in action here](https://notepads.iliyan-trifonov.com "Notepads by Iliyan Trifonov"). This is the official application domain. It is used also by the [mobile Android app](https://play.google.com/store/apps/details?id=com.iliyan_trifonov.notepads "Notepads Mobile") (built with Ionic/AngularJS) too.

## Tech

First I must mention that (most of)the (back-end)code is written in [ES6](http://exploringjs.com/): 
let/Promise/generators/fat arrow functions/modules/default function parameters/template literals.
I use dynamic transpiling with [Babel](http://babeljs.io/) in the app and tests. Later I may refactor the 
generators+promises code to async functions.

And now what the app uses:

[Node.js](https://nodejs.org/) + [Express.js](http://expressjs.com/) = RESTful API that uses Facebook auth and a 
custom accessToken after that. The API uses pure JSON communication.

The index page is loaded through Express.js and is an ejs template. After that [Angular.js](https://angularjs.org/) 
is loaded and handles everything else converting the app to a [SPA](https://en.wikipedia.org/wiki/Single-page_application).

[Passport](http://passportjs.org/) is used for Facebook auth through the site 
and [fbgraph](https://github.com/criso/fbgraph) is used to handle the same for the API.

The API is used fully from the 
[Notepads Ionic application](https://play.google.com/store/apps/details?id=com.iliyan_trifonov.notepads) on Google Play.

[MongoDB](https://www.mongodb.org/) is used as a database. Node.js + 
[Mongoose.js](http://mongoosejs.com/): to create the models and connect to it.

[Mocha](http://mochajs.org/), [proxyquire](https://github.com/thlorenz/proxyquire) 
and [supertest](https://github.com/visionmedia/supertest) are used for unit and integration testing. 
[Protractor](https://github.com/angular/protractor) is used for end-to-end testing.
[Istanbul](https://github.com/gotwarlost/istanbul) is used for coverage. 
I count on its future [source maps parsing](https://github.com/gotwarlost/istanbul/commits/source-map) for ES6 coverage.

## Install

Install [Java](https://java.com/en/download/) for the Selenium server.

Install the global tools:

    npm install -g grunt-cli bower

Go to the project's directory and run (also installs the bower's and [Selenium](http://www.seleniumhq.org/) server's packages):

    npm install

Copy [config/app.conf.json.dist](config/app.conf.json.dist) to config/app.conf.json and edit it for your environment 
(set session SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, MONGODB_URI).

After that run the app with:

    npm start

Or for developing:

    nodemon src/app.js

The application runs in debug mode by default. That's why you need to set the NODE_ENV environment variable while 
starting it for example in production:

    export NODE_ENV=production && forever /myapp/src/app.js

## Testing

Back-end unit and integration tests (you may provide FB app id and secret in [app.conf.json](config/app.conf.json.dist)):

    npm test
    
Front-end unit tests:

    npm run karma
    
End-to-end tests (must have FB email and pass in [app.conf.json](config/app.conf.json.dist)):

    npm run e2e

## What can you do with this app

First I must say that this is one of my first apps after I've read the great book 
[Your first app: node.js](https://leanpub.com/yfa-nodejs "Your first app: node.js") by 
[Jim Schubert](https://leanpub.com/u/jimschubert "Jim Schubert") and so it is influenced by it and by the code in the 
[book's repo](https://github.com/jimschubert/yfa-nodejs-code "Code to accompany the book Your first app: node.js").

Now about the application. You sign up with Facebook. No extra information is needed for this app and only your photo 
and name will be used and stored on the server as well as the Facebook Id to associate the user created in the DB with 
the one logging in.

After you log in you will load the Dashboard where you will be provided with one Sample category and one example 
Notepad called "Read me". You can delete them now or later.

Every Notepad shows its date of creation on the bottom as well as 2 buttons for edit and delete.

On the Dashboard the Notepads are "compressed" in small rectangles. This is usually enough for the most cases.
But if you have a Notepad with a lot of text, you can press Edit and will see it in the way you saved it. 
In the mobile Android version of the application(see the link on the top) you see the Notepad without having to click edit.

Also the names Notepads and Notepad are used intentionally to differentiate this app from many others with the name Notepad/Notes etc.
Think of the Notepad as a note and the Category as a notepad.

You can add a couple of Categories and after that start adding Notepads in them. 
The easiest way to add a new Notepad is through the Dashboard (the home page after logged in). 
See how next to the Categories' names on the Dashboard there are small blue buttons "Add Notepad Here". 
You will use them most of the time.
There is also a link on the top "Add Notepad" that does almost the same but without preselected category.

Clicking on the top link "Categories" you will go to a page where you can see all Categories created and will have 
the possibility to Add New, Edit or Delete a Category. Deleting a Category will also delete all Notepads in it. 
Be careful with that. There is always confirmation when you click on Delete Category or Delete Notepad.

## How it works

The application is a SAP(Single Page Application). 
It is made in 2 parts: back-end and front-end. The back-end provides an API which is used by the front-end.

The back-end is created with NodeJS modules/JavaScript and ExpressJS as well as some helper libraries. 
The Passport NPM module is used to log in/log out the user and to make the connection with Facebook. 
At the same time the API uses the fbgraph NPM module to verify the facebook data sent to it while the user logges in 
from the mobile Android app.

ExpressJS Router makes my life easier when I needed to have separate configurations for the different API routes.

The front-end is made with AngularJS and Bootstrap. 
Angular's $http is used to call the API using GET/POST/PUT/DELETE methods.

When the API is used it needs a logged in user with Passport through the site or an accessToken generated when the 
user was created for the mobile Android application(or any other code that may use the API exclusively).

Thanks to MongoDB/Mongoose the DB structure will be automatically created on first use.

## The API

Currently the API is situated at https://notepads.iliyan-trifonov.com/api/v1

Here's a table showing what requests can be made and their possible results:

<table>
    <thead>
        <th><sub>Endpoint</sub></th>
        <th><sub>Params(GET)</sub></th>
        <th><sub>Body(POST, PUT)</sub></th>
        <th><sub>Status returned</sub></th>
        <th><sub>Data returned</sub></th>
        <th><sub>Example result</sub></th>
    </thead>
    <tbody>
        <tr>
            <td colspan="6">/notepads</td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">GET /notepads</pre></sub></td>
            <td><sub><pre lang="javascript">?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>OK = success, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">[{notepad objects}..], []</pre></sub></td>
            <td><sub><pre lang="javascript">
[
    {
        "_id": "5599057e4f1b9b8826711e9a",
        "title": "notepad titlte",
        "text": "notepad text",
        "category": "5599057e4f1b9b8826711e99"
    },
    {
        "_id": "5599057e4f1b9b8826711e9c",
        "title": "notepad titlte 2",
        "text": "notepad text 2",
        "category": "5599057e4f1b9b8826711e99"
    },
    ...
]
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">GET /notepads</pre></sub></td>
            <td><sub><pre lang="javascript">?insidecategories=1&token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>OK = success, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">
[
    {category objects-->
        notepads:[
            {notepad objects...}
        ]
    }
    ..
],
[]
</pre></sub></td>
            <td><sub><pre lang="javascript">
[
    {
        "_id":"5599057e4f1b9b8826711e99",
        "name":"category name",
        "notepadsCount": 1,
        "notepads": [
            {
                "_id": "5599057e4f1b9b8826711e9a",
                "title": "notepad title",
                "text": "notepad text",
                "created": "2015/07/05 13:22:54"
            },
            {
                "_id": "5599057e4f1b9b8826711e9c",
                "title": "notepad title 2",
                "text": "notepad text 2",
                "created": "2015/07/05 13:23:28"
            },
            ...
        ]
    },
    ...
]
        </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">POST /notepads</pre></sub></td>
            <td><sub><pre lang="javascript">?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    title: "new title",
    text: "new text",
    category: "5599057e4f1b9b8826711e99",
}
            </pre></sub></td>
            <td><sub>CREATED = success, BAD_REQUEST, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript"><sub>{notepad object}, {}</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    "__v": 0,
    "category": "5599057e4f1b9b8826711e99",
    "title": "new title",
    "text": "new text",
    "user": "5599057e4f1b9b8826711e98",
    "_id": "559968509ae0090c22e76e92"
}            
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">GET /notepads/:id</pre></sub></td>
            <td><sub><pre lang="javascript">?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>OK = success, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript"><sub>{notepad object}, {}</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    "_id": "5599057e4f1b9b8826711e9a",
    "title": "new title",
    "text": "new text",
    "category": "5599057e4f1b9b8826711e99"
}
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">PUT /notepads/:id</pre></sub></td>
            <td><sub><pre lang="javascript">:id is ObjectId(), ?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    title: "updated title",
    text: "updated text",
    category: "5599057e4f1b9b8826711e99",
}
            </pre></sub></td>
            <td><sub>CREATED = success, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript"><sub>{notepad object}, {}</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    "_id": "5599057e4f1b9b8826711e9a",
    "title": "new title",
    "text": "new text",
    "category": "5599057e4f1b9b8826711e99",
    "user": "5599057e4f1b9b8826711e98",
    "__v": 0
}
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">DELETE /notepads/:id</pre></sub></td>
            <td><sub><pre lang="javascript">:id is ObjectId(), ?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>NO_CONTENT = success, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript"><sub>none, {}</pre></sub></td>
            <td><sub><pre lang="javascript">none on success or {}</pre></sub></td>
        </tr>

        <tr>
            <td colspan="6">/categories</td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">GET /categories</pre></sub></td>
            <td><sub><pre lang="javascript">?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>OK = success, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">[{category objects}..], []</pre></sub></td>
            <td><sub><pre lang="javascript">
[
  {
    "_id": "5599057e4f1b9b8826711e99",
    "name": "Sample category",
    "notepadsCount": 3
  },
  ...
]
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">POST /categories</pre></sub></td>
            <td><sub><pre lang="javascript">?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    "name": "new name"
}            
            </pre></sub></td>
            <td><sub>CREATED = success, BAD_REQUEST, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">{category object}, {}</pre></sub></td>
            <td><sub><pre lang="javascript">
{
  "__v": 0,
  "name": "new name",
  "user": "5599057e4f1b9b8826711e98",
  "_id": "559a4fa0c29f8ea009271b83",
  "notepadsCount": 0
}
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">GET /categories/:id</pre></sub></td>
            <td><sub><pre lang="javascript">:id is ObjectId(), ?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>OK = success, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">{category object}, {}</pre></sub></td>
            <td><sub><pre lang="javascript">
{
  "_id": "559a4fa0c29f8ea009271b83",
  "name": "new name"
}
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">PUT /categories/:id</pre></sub></td>
            <td><sub><pre lang="javascript">:id is ObjectId(), ?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    "name": "updated name"
}                        
            </pre></sub></td>
            <td><sub>CREATED = success, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">{category object}, {}</pre></sub></td>
            <td><sub><pre lang="javascript">
{
  "_id": "559a4fa0c29f8ea009271b83",
  "name": "updated name",
  "user": "5599057e4f1b9b8826711e98",
  "__v": 0,
  "notepadsCount": 0
}
            </pre></sub></td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">DELETE /categories/:id</pre></sub></td>
            <td><sub><pre lang="javascript">:id is ObjectId(), ?token=xxx</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub>NO_CONTENT = success, NOT_FOUND, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub><pre lang="javascript">none, {}</pre></sub></td>
            <td><sub><pre lang="javascript">none on success or {}</pre></sub></td>
        </tr>

        <tr>
            <td colspan="6">/users</td>
        </tr>
        <tr>
            <td><sub><pre lang="javascript">POST /users/auth</pre></sub></td>
            <td><sub><pre lang="javascript">none</pre></sub></td>
            <td><sub><pre lang="javascript">
{
    "accessToken": "xxx"
}

or

{
    "fbId": "xxx",
    "fbAccessToken": "xxx"
}
            </pre></sub></td>
            <td><sub>OK/CREATED = success, BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR</sub></td>
            <td><sub>
                <pre lang="javascript">{user object},</pre>
                <pre lang="javascript">{accessToken: "xxx"}</pre>
            </sub></td>
            <td><sub><pre lang="javascript">
{
  "_id": "5599057e4f1b9b8826711e98",
  "accessToken": "xxx",
  "facebookId": "xxx",
  "name": "FB user name",
  "photo": "https://scontent.xx.fbcdn.net/xxxxx.jpg...",
  "__v": 0,
  "notepads": [
    "559968509ae0090c22e76e92",
    "559968ee9ae0090c22e76e93",
    "55996ac39ae0090c22e76e94",
    ...
  ],
  "categories": [
    "5599057e4f1b9b8826711e99",
    "559a4fa0c29f8ea009271b83",
    ...
  ]
}
            
or

{
  "accessToken": "xxx"
}
            </pre></sub></td>
        </tr>        
    </tbody>
</table>

## TODO

More integration and e2e tests. 100% unit tests.

Convert all possible code to ES6 while keeping the compatibility with Node.js v10+. This one is already in progress
and you can see in the code that ES5 and ES6 syntax work together.

Remove transpiling after Node.js and io.js merge and when support for the ES6 code here is full.
 
Covert the front-end code to ES6 (with Babel).

Use ES7 code where the transpilers allow it.

[![Analytics](https://ga-beacon.appspot.com/UA-234720-45/notepads-nodejs-angularjs-mongodb-bootstrap/readme)](https://github.com/igrigorik/ga-beacon)

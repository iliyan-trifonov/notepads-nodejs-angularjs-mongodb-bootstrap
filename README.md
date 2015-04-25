### Notepads App built with NodeJS, ExpressJS, MongoDB, AngularJS and Bootstrap. Multiuser application that works with multiple Notepads in different Categories.

[![Dependency Status](https://www.versioneye.com/user/projects/553a42bb1d2989cb7800010c/badge.svg?style=flat)](https://www.versioneye.com/user/projects/553a42bb1d2989cb7800010c)
[![Dependency Status](https://www.versioneye.com/user/projects/553a42b71d2989bdd500009a/badge.svg?style=flat)](https://www.versioneye.com/user/projects/553a42b71d2989bdd500009a)

[See it in action here](https://notepads.iliyan-trifonov.com "Notepads by Iliyan Trifonov"). This is the official application domain. It is used also by the [mobile Android app](https://play.google.com/store/apps/details?id=com.iliyan_trifonov.notepads "Notepads Mobile") (built with Ionic/AngularJS) too.

## Install

Go to the project's directory and run:

    npm install
    bower install

Copy config/app.conf.json.dist to config/app.conf.json and edit it for your environment (set session SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, MONGODB_URI).

After that run the app with:

    npm start

Or for developing:

    nodemon src/app.js

The application runs in debug mode by default. That's wahy you need to set the NODE_ENV environment variable while starting it for example in production:

    export NODE_ENV=production && forever /myapp/src/app.js

## What can you do with this app

First I must say that this is one of my first apps after I've read the great book [Your first app: node.js](https://leanpub.com/yfa-nodejs "Your first app: node.js") by [Jim Schubert](https://leanpub.com/u/jimschubert "Jim Schubert") and so it is influenced by it and by the code in the [book's repo](https://github.com/jimschubert/yfa-nodejs-code "Code to accompany the book Your first app: node.js").

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

## TODO

You guessed it! Testing.

And some small things that I didn't have time to finish - code improvements, db optimisation.

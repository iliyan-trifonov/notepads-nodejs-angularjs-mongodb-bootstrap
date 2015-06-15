'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            app: {
                src: ['src/**/*.js', "!src/public/vendor/**/*.js"]
            },
            test: {
                src: ['test/**/*.js']
            }
        },
        mocha_istanbul: {
            src: 'test/server/',
            options: {
                reporter: 'spec',
                bail: true,
                timeout: 12000,
                recursive: true,
                coverage: true,
                mochaOptions: ['--compilers=js:babel/register']
            }
        },
        specCheck: {
            options: {
                severity: 'warn',
                testDir: 'test/server/',
                baseDir: 'src/',
                convention: '_test.js'
            },
            files: {
                src: ['src/**/*.js', '!src/public/**/*.js', '!src/db.js']
            }
        },
        env: {
            test: {
                NODE_ENV: 'test'
            }
        }
    });

    grunt.event.on('coverage', function(lcov, done){
        require('coveralls').handleInput(lcov, function(err){
            if (err) {
                return done(err);
            }
            done();
        });
    });


    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-spec-check');

    grunt.registerTask('test', ['env:test', 'jshint:app', 'mocha_istanbul', 'specCheck']);
    grunt.registerTask('default', 'test');

};

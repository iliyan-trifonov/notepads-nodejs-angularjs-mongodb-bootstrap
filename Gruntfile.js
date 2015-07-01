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
        },
        protractor_webdriver: {
            all: {
                options: {
                    keepAlive: true
                }
            }
        },
        protractor: {
            options: {
                configFile: "config/protractor.conf.js"
            },
            all: {}
        },
        express: {
            dev: {
                options: {
                    script: './src/app.js'
                }
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
    grunt.loadNpmTasks('grunt-protractor-webdriver');
    grunt.loadNpmTasks('grunt-protractor-runner');
    grunt.loadNpmTasks('grunt-express-server');

    grunt.registerTask('lintall', ['jshint:gruntfile', 'jshint:app', 'jshint:test']);
    grunt.registerTask('test', ['env:test', 'lintall', 'mocha_istanbul', 'specCheck']);
    grunt.registerTask('e2e', ['express', 'protractor_webdriver', 'protractor']);
    grunt.registerTask('default', 'test');

};

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: [
                'demo/**/*.js',
                'src/js/*.js',
                '!src/js/*.html.js',
                'gruntfile.js'
            ],
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },
        compass: {
            dist: {
                options: {
                    sassDir: 'src/scss',
                    cssDir: 'demo/css'
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: 9000,
                    hostname: 'localhost',
                    open: {
                        target: 'http://localhost:9000/demo/development.html'
                    },
                    keepalive: true
                }
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, src: ['demo/css/ioki-fatscroll.css'], dest: './', flatten: true}
                ]
            }
        },
        concat: {
            dist: {
                src: [
                    'src/js/ioki-fatscroll-directive.js',
                    'src/js/ioki-fatscroll-service.js',
                    'src/js/ioki-fatscroll.tpl.html.js'
                ],
                dest: 'ioki-fatscroll.js'
            }
        },
        ngAnnotate: {
            release: {
                src: ['ioki-fatscroll.js'],
                dest: 'ioki-fatscroll.min.js'
            }
        },
        uglify: {
            release: {
                options: {
                    report: 'min',
                    mangle: true
                },
                files: {
                    'ioki-fatscroll.min.js': ['ioki-fatscroll.js']
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'ioki-fatscroll.min.css': ['ioki-fatscroll.css']
                }
            }
        },
        ngtemplates:  {
            app: {
                options: {
                    module: 'ioki.fatscroll',
                    url: function(url) { return url.replace('src/js/', 'templates/').replace('.tpl.html', ''); }
                },
                src: 'src/js/*.tpl.html',
                dest: 'src/js/ioki-fatscroll.tpl.html.js'
            }
        },
        watch: {
            js: {
                files: [
                    'src/js/**/*.js',
                    'demo/**/*.js'
                ],
                tasks: ['jshint'],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            tpl: {
                files: [
                    'src/js/**/*.tpl.html'
                ],
                tasks: ['ngtemplates'],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            html: {
                files: [
                    'demo/**/*.html'
                ],
                options: {
                    spawn: false,
                    livereload: true
                }
            },
            css: {
                files: ['src/scss/*.scss'],
                tasks: ['compass'],
                options: {
                    spawn: false,
                    livereload: true
                }
            }
        },
        concurrent: {
            server: [
                'connect:server',
                'watch'
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('release', ['test', 'copy', 'ngtemplates', 'concat', 'ngAnnotate', 'uglify', 'cssmin']);
    grunt.registerTask('serve', ['concurrent:server']);
    grunt.registerTask('build', ['jshint', 'compass']);

    grunt.registerTask('default', ['build', 'serve']);
};
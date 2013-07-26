(function() {
  module.exports = function() {

    var banner = "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> (<%= grunt.template.date('longTime') %>)\n* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n";

    this.initConfig({
      pkg: this.file.readJSON('package.json'),
      concat: {
        options: {
          stripBanners: true,
          banner: banner
        },
        dist: {
          src: [
            // Libs
            'libs/actionbar/js/actionbar.js',
            // Main
            'src/dataflow.js',
            'src/state.js',
            // Models
            "src/modules/graph.js",
            "src/modules/node.js",
            "src/modules/input.js",
            "src/modules/output.js",
            "src/modules/edge.js",
            "src/modules/card.js",
            // Views
            "src/modules/graph-view.js",
            "src/modules/node-view.js",
            "src/modules/input-view.js",
            "src/modules/output-view.js",
            "src/modules/edge-view.js",
            "src/modules/card-view.js",
            // Plugins
            "src/plugins/edit.js",
            "src/plugins/elements.js",
            "src/plugins/library.js",
            "src/plugins/view-source.js",
            "src/plugins/log.js",
            "src/plugins/inspector.js",
            // Nodes
            "src/nodes/base.js"
          ],
          dest: 'build/<%= pkg.name %>.build.js'
        }
      },
      uglify: {
        options: {
          banner: banner,
          report: 'min'
        },
        dist: {
          files: {
            'build/<%= pkg.name %>.min.js': ['build/<%= pkg.name %>.build.js']
          }
        }
      },
      jshint: {
        all: ['Gruntfile.js', 'src/*.js', 'src/**/*.js'],
        force: {
          options: { force: true },
          files: { src: ['Gruntfile.js', 'src/*.js', 'src/**/*.js'] }
        }
      },
      connect: {
        options : {
          port : 8000,
          hostname : '*' // available from ipaddress:8000 on same network (or name.local:8000)
        },
        uses_defaults: {}
      },
      watch: {
        scripts: {
          files: ['Gruntfile.js', 'src/*.js', 'src/**/*.js'],
          tasks: ['jshint:force', 'build'],
          options: {
            nospawn: true
          }
        }
      },
      cssmin: {
        dist: {
          options: {
            banner: '/* meemoo/dataflow compressed styles. See debug.html for uncompressed. */',
            keepSpecialComments: 0
          },
          files: {
            'build/default/dataflow.min.css': [
              'themes/default/dataflow.css',
              'themes/default/modules/node.css',
              'themes/default/modules/edge.css',
              'themes/default/modules/port.css',
              'themes/default/modules/menu.css',
              'themes/default/modules/actionbar.css',
              'themes/default/modules/jqui.css',
              'libs/actionbar/vendor/css/font-awesome.min.css'
            ]
          }
        }
      }
    });

    this.loadNpmTasks('grunt-contrib-concat');
    this.loadNpmTasks('grunt-contrib-uglify');
    this.loadNpmTasks('grunt-contrib-jshint');
    this.loadNpmTasks('grunt-contrib-connect');
    this.loadNpmTasks('grunt-contrib-watch');
    this.loadNpmTasks('grunt-contrib-cssmin');

    this.registerTask('dev', ['connect', 'watch']);
    this.registerTask('build', ['concat:dist', 'uglify:dist', 'cssmin:dist']);
    this.registerTask('test', ['jshint']);
    this.registerTask('default', ['test', 'build']);
  };

}).call(this);

(function() {
  module.exports = function() {
    var banner;

    banner = "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> (<%= grunt.template.date('longTime') %>)\n* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n";
    this.initConfig({
      pkg: this.file.readJSON('package.json'),
      concat: {
        options: {
          stripBanners: true,
          banner: banner
        },
        dist: {
          src: [
            // Main
            'src/dataflow.js',
            // Models
            "src/modules/graph.js",
            "src/modules/node.js",
            "src/modules/input.js",
            "src/modules/output.js",
            "src/modules/edge.js",
            // Views
            "src/modules/graph-view.js",
            "src/modules/node-view.js",
            "src/modules/input-view.js",
            "src/modules/output-view.js",
            "src/modules/edge-view.js",
            // Nodes
            "src/nodes/base.js",
            "src/nodes/base-resizable.js",
            "src/nodes/test.js",
            // Nodes (for subgraphs)
            "src/nodes/dataflow-input.js",
            "src/nodes/dataflow-output.js",
            "src/nodes/dataflow-subgraph.js",
            // Plugins
            "src/plugins/edit.js",
            "src/plugins/library.js",
            "src/plugins/view-source.js",
            "src/plugins/log.js"
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
        all: ['src/*.js', 'src/**/*.js']
      },
      connect: {
        uses_defaults: {}
      },
      watch: {
        scripts: {
          files: ['src/*.js', 'src/**/*.js'],
          tasks: ['jshint'],
          options: {
            nospawn: true
          }
        }
      }
    });
    this.loadNpmTasks('grunt-contrib-concat');
    this.loadNpmTasks('grunt-contrib-uglify');
    this.loadNpmTasks('grunt-contrib-jshint');
    this.loadNpmTasks('grunt-contrib-connect');
    this.loadNpmTasks('grunt-contrib-watch');

    this.registerTask('dev', ['connect', 'watch']);
    this.registerTask('build', ['concat:dist', 'uglify:dist']);
    this.registerTask('test', ['jshint']);
    this.registerTask('default', ['test', 'build']);
  };

}).call(this);

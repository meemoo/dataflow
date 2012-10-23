/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:dataflow.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      dist: {
        src: [
          '<banner:meta.banner>', 
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
          "src/nodes/test.js"
          // "src/nodes/subgraph.js",
          // "src/nodes/input.js", 
          // "src/nodes/output.js"
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    lint: {
      files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        console: true,
        jQuery: true,
        "$": true,
        Backbone: true,
        Underscore: true,
        "_": true,
        Dataflow: true
      }
    },
    uglify: {}
  });

  // Default task.
  // grunt.registerTask('default', 'lint qunit concat min');
  grunt.registerTask('default', 'lint concat min');

  grunt.registerTask('dev', 'server watch');

};

module.exports = ->
  banner = """/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %> (<%= grunt.template.date('longTime') %>)
* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */"""

  @initConfig
    pkg: @file.readJSON 'package.json'

    # Build setup: concatenate source files
    concat:
      options:
        stripBanners: true
        banner: banner
      dist:
        src: [
          'src/*.js'
          'src/**/*.js'
        ]
        dest: 'build/<%= pkg.name %>.js'

    uglify:
      options:
        banner: banner
        report: 'min'
      dist:
        files:
          'build/<%= pkg.name %>.min.js': ['build/<%= pkg.name %>.js']

    jshint:
      all: ['src/*.js', 'src/**/*.js']

  # Build dependencies
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Testing dependencies
  @loadNpmTasks 'grunt-contrib-jshint'

  # Local tasks
  @registerTask 'build', ['concat:dist', 'uglify:dist']
  @registerTask 'test', ['jshint']
  @registerTask 'default', ['test', 'build']

// Structure with guidance from http://weblog.bocoup.com/organizing-your-backbone-js-application-with-modules/

(function(){
  var App = Backbone.Model.extend({
    // Create this closure to contain the cached modules
    modules: {},
    module: function(name) {
      // Create a new module reference scaffold or load an
      // existing module.
      // If this module has already been created, return it.
      if (this.modules[name]) {
        return this.modules[name];
      }
      // Create a module and save it under this name
      return this.modules[name] = { Views: {} };
    },
    loadGraph: function(source) {
      if (this.graph) {
        this.graph.remove();
      }
      var Graph = this.module("graph");
      var newGraph = new Graph.Model(source);
      newGraph.view = new Graph.Views.Main({model: newGraph});
      $("#app").html(newGraph.view.render().el);

      // For debugging
      this.graph = newGraph;

      return newGraph;
    }
  });

  // Our global
  window.Dataflow = new App();
}());

// All code has been downloaded and evaluated and is ready to be initialized.
jQuery(function($) {

  // Router
  var DataflowRouter = Backbone.Router.extend({
    routes: {
      "": "index"
    },
    index: function() {

    }
  });
  Dataflow.router = new DataflowRouter();
  Backbone.history.start();

});

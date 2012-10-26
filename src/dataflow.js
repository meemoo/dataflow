// Structure with guidance from http://weblog.bocoup.com/organizing-your-backbone-js-application-with-modules/

(function(){
  var App = Backbone.Model.extend({
    // Create the object to contain the modules
    modules: {},
    module: function(name) {
      // Create a new module reference scaffold or load an existing module.
      // If this module has already been created, return it.
      if (this.modules[name]) {
        return this.modules[name];
      }
      // Create a module scaffold and save it under this name
      return this.modules[name] = {};
    },
    // Create the object to contain the nodes
    nodes: {},
    node: function(name) {
      // Create a new node reference scaffold or load an existing node.
      // If this node has already been created, return it.
      if (this.nodes[name]) {
        return this.nodes[name];
      }
      // Create a node scaffold and save it under this name
      return this.nodes[name] = {};
    },
    loadGraph: function(source) {
      if (this.graph) {
        this.graph.remove();
      }
      var Graph = this.module("graph");
      var newGraph = new Graph.Model(source);
      newGraph.view = new Graph.View({model: newGraph});
      $("#app").html(newGraph.view.render().el);

      // For debugging
      this.graph = this.currentGraph = newGraph;

      return newGraph;
    },
    debug: false,
    log: function(message) {
      this.trigger("log", message, arguments);
      if (this.debug) {
        console.log("Dataflow: ", arguments);
      }
    },
    types: [
      "all",
      "canvas:2d",
      "canvas:webgl",
      "string",
      "number",
      "int",
      "object",
      "array"
    ]
  });

  // Our global
  window.Dataflow = new App();

  // Backbone hacks
  // Discussed here http://stackoverflow.com/a/13075845/592125
  Backbone.View.prototype.addEvents = function(events) {
    this.delegateEvents( _.extend(_.clone(this.events), events) );
  };
}());

// All code has been downloaded and evaluated and app is ready to be initialized.
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

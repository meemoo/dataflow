(function(){
  var App = Backbone.Model.extend({
    // "$el": $("#app"),
    "$": function(query) {
      return this.$el.children(query);
    },
    initialize: function(q){
      this.el = document.createElement("div");
      this.el.className = "dataflow";
      this.$el = $(this.el);
      this.$el.append('<div class="plugins"/>');
      this.$el.append('<div class="navigation"/>');

      // Debug mode
      this.debug = this.get("debug");

      // Add plugins
      console.log(this.plugins);
      for (var name in this.plugins) {
        if (this.plugins[name].initialize) {
          this.plugins[name].initialize(this);
        }
      }

      // Add the main element to the page
      var appendTo = this.get("appendTo");
      appendTo = appendTo ? appendTo : "body";
      $(appendTo).append(this.el);
    },
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
    plugins: {},
    plugin: function(name) {
      if (this.plugins[name]) {
        return this.plugins[name];
      }
      return this.plugins[name] = {};
    },
    addPlugin: function(name, html) {
      if (html) {
        var title = $('<h1 />')
          .text(name)
          .click(function(){
            $(this).next().toggle();
          });
        var section = $('<div />')
          .html(html)
          .hide();
        this.$(".plugins")
          .append(title)
          .append(section);
      }
    },
    loadGraph: function(source) {
      if (this.graph) {
        if (this.currentGraph.view) {
          this.currentGraph.view.remove();
        }
        if (this.graph.view) {
          this.graph.view.remove();
        }
        this.graph.remove();
      }
      var Graph = this.module("graph");

      source.dataflow = this;
      var newGraph = new Graph.Model(source);
      newGraph.view = new Graph.View({model: newGraph});
      this.$el.append(newGraph.view.render().el);

      // For debugging
      this.graph = this.currentGraph = newGraph;

      return newGraph;
    },
    showGraph: function(graph){
      // Hide current
      this.currentGraph.view.$el.detach();
      // Show new
      this.$el.append(graph.view.el);
      graph.view.render();
      this.currentGraph = graph;
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
  window.Dataflow = App;

  // Backbone hacks
  // Discussed here http://stackoverflow.com/a/13075845/592125
  Backbone.View.prototype.addEvents = function(events) {
    this.delegateEvents( _.extend(_.clone(this.events), events) );
  };

  // Simple collection view
  Backbone.CollectionView = Backbone.Model.extend({
    // this.tagName and this.itemView should be set
    initialize: function(){
      this.el = document.createElement(this.tagName);
      this.$el = $(this.el);
      var collection = this.get("collection");
      collection.each(this.addItem, this);
      collection.on("add", this.addItem, this);
      collection.on("remove", this.removeItem, this);
    },
    addItem: function(item){
      item.view = new this.itemView({model:item});
      this.$el.append(item.view.render().el);
    },
    removeItem: function(item){
      item.view.remove();
    }
  });

}());

// All code has been downloaded and evaluated and app is ready to be initialized.
// jQuery(function($) {

//   // Router
//   var DataflowRouter = Backbone.Router.extend({
//     routes: {
//       "": "index"
//     },
//     index: function() {

//     }
//   });
//   Dataflow.router = new DataflowRouter();
//   Backbone.history.start();

// });

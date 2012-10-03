(function(Graph) {
 
  var template = '<div class="edges" /><div class="nodes" />';

  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "graph",
    initialize: function() {
      var nodes = this.model.get("nodes");
      var edges = this.model.get("edges");

      // Initialize nodes and edges
      nodes.each(function(node){
        node.view = new Node.Views.Main({model:node});
      }, this);
      edges.each(function(edge){
        edge.view = new Edge.Views.Main({model:edge});
      }, this);

      // Listen for changes
      nodes.on("add", this.addNode, this);
      nodes.on("remove", this.removeNode, this);
      edges.on("add", this.addEdge, this);
      edges.on("remove", this.removeEdge, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      // Render nodes and edges
      this.model.get("nodes").each(function(node){
        this.$(".nodes").append(node.view.render().el);
      }, this);
      this.model.get("edges").each(function(edge){
        this.$(".edges").append(edge.view.render().el);
      }, this);

      return this;
    },
    addNode: function(node){
      var view = node.view = new Node.Views.Main({model:node});
      this.$(".nodes").append(view.render().el);
    },
    removeNode: function(node){
      node.view.$el.remove();
    },
    addEdge: function(edge){
      var view = edge.view = new Edge.Views.Main({model:edge});
      this.$(".edges").append(view.render().el);
    },
    removeEdge: function(edge){
      edge.view.$el.remove();
    }
  });

}(Dataflow.module("graph")) );

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
      nodes.view = new Node.Views.Collection({
        collection: nodes
      });
      nodes.view.render();
      nodes.view.renderAllItems();
      //
      edges.view = new Edge.Views.Collection({
        collection: edges
      });
      edges.view.render();
      edges.view.renderAllItems();
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      this.$(".nodes").html(this.model.get("nodes").view.el);
      this.$(".edges").html(this.model.get("edges").view.el);

      return this;
    }
  });

}(Dataflow.module("graph")) );

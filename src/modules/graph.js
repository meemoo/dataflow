(function(Graph) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Model = Backbone.Model.extend({
    initialize: function() {
      // Set up nodes (convert nodes object array to backbone model collection)
      var nodes = this.nodes = new Node.Collection();
      nodes.graph = this;
      nodes.add(this.get("nodes"));
      // Set up edges
      var edges = this.edges = new Edge.Collection();
      edges.graph = this;
      edges.add(this.get("edges"));
      // Attach them
      this.set({
        nodes: nodes,
        edges: edges
      });
      nodes.on("all", function(){
        this.trigger("change");
      }, this);
      edges.on("all", function(){
        this.trigger("change");
      }, this);
    }
  });

}(Dataflow.module("graph")) );

(function(Graph) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Model = Backbone.Model.extend({
    initialize: function() {
      // Set up nodes
      var nodes = new Node.Collection(this.get("nodes"));
      nodes.graph = this;
      nodes.each(function(node){
        node.graph = this;
      }, this);
      // Set up edges
      var edges = new Edge.Collection(this.get("edges"));
      edges.graph = this;
      edges.each(function(edge){
        edge.graph = this;
        edge.source = nodes.get(edge.get("source"));
        edge.target = nodes.get(edge.get("target"));
      }, this);
      // Attach them
      this.set({
        nodes: nodes,
        edges: edges
      });
      nodes.on("change add remove", function(){
        this.trigger("change");
      }, this);
      edges.on("add remove", function(){
        this.trigger("change");
      }, this);
    }
  });

}(Dataflow.module("graph")) );

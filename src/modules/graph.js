(function(Graph) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Model = Backbone.Model.extend({
    initialize: function() {
      this.set({ 
        nodes: new Node.Collection(this.get("nodes")),
        edges: new Edge.Collection(this.get("edges"))
      });
    },
    addNode: function(node){
      this.get("nodes").add(node);
    },
    addEdge: function(edge){
      this.get("edges").add(edge);
    }
  });

}(Dataflow.module("graph")) );

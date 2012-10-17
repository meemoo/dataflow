(function(Graph) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Model = Backbone.Model.extend({
    initialize: function() {
      var i;
      // Set up nodes (convert nodes array to backbone model collection)
      var nodes = this.nodes = new Node.Collection();
      nodes.graph = this;
      var nodesArray = this.get("nodes");
      for(i=0; i<nodesArray.length; i++) {
        var node = nodesArray[i];
        node.graph = this;
        node = new Node.Model(node);
        nodes.add(node);
      }
      // Set up edges
      var edges = this.edges = new Edge.Collection();
      edges.graph = this;
      var edgesArray = this.get("edges");
      for(i=0; i<edgesArray.length; i++) {
        var edge = edgesArray[i];
        edge.graph = this;
        edge.id = edge.source.node+":"+edge.source.port+"→"+edge.target.node+":"+edge.target.port;
        edge = new Edge.Model(edge);
        edges.add(edge);
      }
      // Attach collections to graph
      this.set({
        nodes: nodes,
        edges: edges
      });
      nodes.on("all", function(){
        this.trigger("change");
      }, this);
      nodes.on("remove", function(node){
        node.remove();
      }, this);
      edges.on("all", function(){
        this.trigger("change");
      }, this);
    },
    remove: function(){
      this.nodes.each(function(node){
        node.remove();
      }, this);
    }
  });

}(Dataflow.module("graph")) );

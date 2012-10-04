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
      // this.get("nodes").graph = this;
      // this.get("edges").graph = this;
      this.get("nodes").on("all", function(){
        this.trigger("change");
      }, this);
      this.get("edges").on("all", function(){
        this.trigger("change");
      }, this);
    }
  });

}(Dataflow.module("graph")) );

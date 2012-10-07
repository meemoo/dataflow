( function(Edge) {
 
  // Dependencies

  Edge.Model = Backbone.Model.extend({
    initialize: function() {
      var nodes = this.collection.graph.nodes;
      this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
      this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model
  });

}(Dataflow.module("edge")) );

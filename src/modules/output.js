( function(Output) {
 
  Output.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      label: "",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
    },
    remove: function(){
      // Port removed from node's outputs collection
      // Remove related edges
      var relatedEdges = this.parentNode.parentGraph.edges.filter(function(edge){
        // Find connected edges
        return edge.isConnectedToPort(this);
      }, this);
      _.each(relatedEdges, function(edge){
        edge.collection.remove(edge);
      }, this);
    }

  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow.module("output")) );

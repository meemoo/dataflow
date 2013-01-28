( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "input",
      label: "",
      type: "all",
      description: ""
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
    },
    remove: function(){
      // Port removed from node's inputs collection
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

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );

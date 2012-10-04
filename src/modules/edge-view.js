( function(Edge) {
 
  Edge.Views.Main = Backbone.View.extend({
    className: "edge",
    initialize: function() {
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main
  }); 

}(Dataflow.module("edge")) );

(function(Dataflow){

  var Card = Dataflow.prototype.module("card");

  Card.View = Backbone.View.extend({
    tagName: "div",
    initialize: function(){
    }
  });

  Card.CollectionView = Backbone.CollectionView.extend({
    tagName: "div",
    itemView: Card.View
  }); 

}(Dataflow));

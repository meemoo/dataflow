(function(Dataflow){

  var Card = Dataflow.prototype.module("card");

  Card.Model = Backbone.Model.extend({
    
  });

  Card.Collection = Backbone.Collection.extend({
    model: Card.Model
  });

}(Dataflow));

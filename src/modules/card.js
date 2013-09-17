(function(Dataflow){

  var Card = Dataflow.prototype.module("card");

  Card.Model = Backbone.Model.extend({
    defaults: {
      pinned: false
    },
    initialize: function () {
      this.dataflow = this.get("dataflow");
    },
    hide: function () {
      this.dataflow.shownCards.remove( this );
    }
  });

  Card.Collection = Backbone.Collection.extend({
    model: Card.Model
  });

}(Dataflow));

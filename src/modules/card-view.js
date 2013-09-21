(function(Dataflow){

  var Card = Dataflow.prototype.module("card");

  var template = 
    '<div class="dataflow-card-control">'+
      '<button title="pin" class="dataflow-card-pin icon-pushpin"></button>'+
      '<button title="close" class="dataflow-card-close icon-remove"></button>'+
    '</div>';

  Card.View = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-card",
    template: _.template(template),
    events: {
      "click .dataflow-card-pin": "togglePin",
      "click .dataflow-card-close": "hide"
    },
    initialize: function () {
      this.$el.html(this.template());
      this.$el.append(this.model.get("card").el);
      this.listenTo(this.model, "change:pinned", this.pinnedChanged);
      this.pinnedChanged();
    },
    togglePin: function () {
      var pinned = !this.model.get("pinned");
      this.model.set("pinned", pinned);
      if (!pinned) {
        this.hide();
      }
    },
    pinnedChanged: function () {
      if ( this.model.get("pinned") ) {
        this.$(".dataflow-card-pin").addClass("active");
      } else {
        this.$(".dataflow-card-pin").removeClass("active");
      }
    },
    hide: function () {
      this.model.hide();
    },
    remove: function () {
      this.$el.detach();
    }
  });

  Card.CollectionView = Backbone.CollectionView.extend({
    tagName: "div",
    className: "dataflow-cards",
    itemView: Card.View,
    prepend: true,
    bringToTop: function (card) {
      this.$el.prepend( card.view.el );
    }
  });

}(Dataflow));

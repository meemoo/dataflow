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
      this.card = this.model.get("card");
      this.$el.append(this.card.el);
      this.listenTo(this.model, "change:pinned", this.pinnedChanged);
      this.pinnedChanged();
    },
    animate: function (timestamp) {
      if (typeof this.card.animate === "function") {
        this.card.animate(timestamp);
      }
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

  // requestAnimationFrame shim
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function( callback ){
                window.setTimeout(callback, 1000 / 20);
              };
    })();
  }

  Card.CollectionView = Backbone.CollectionView.extend({
    tagName: "div",
    className: "dataflow-cards",
    itemView: Card.View,
    prepend: true,
    initialize: function () {
      // Super
      Backbone.CollectionView.prototype.initialize.apply(this, arguments);
      // Set up animation loop
      var loop = function (timestamp) {
        window.requestAnimationFrame(loop);
        // Call all visible
        this.collection.each(function(card){
          if (card.view) {
            card.view.animate(timestamp);
          }
        });
      }.bind(this);
      loop();
    },
    bringToTop: function (card) {
      this.$el.prepend( card.view.el );
    }
  });

}(Dataflow));

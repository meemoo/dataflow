(function (Dataflow) {
  var MenuItem = Backbone.Model.extend({
    defaults: {
      label: '',
      icon: '',
      action: null
    }
  });

  var Menu = Backbone.Collection.extend({
    model: MenuItem
  });

  var Card = Dataflow.prototype.module('card');
  var MenuCard = Dataflow.prototype.module('menucard');
  MenuCard.Model = Card.Model.extend({
    initialize: function () {
      this.menu = new Menu();
      Card.Model.prototype.initialize.call(this);
    }
  });
}(Dataflow));

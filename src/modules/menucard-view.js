(function (Dataflow) {
  var Card = Dataflow.prototype.module('card');
  var MenuCard = Dataflow.prototype.module('menucard');

  var MenuItemView = Backbone.View.extend({
    tagName: 'li',
    template: '<button title="<%- label %>"><i class="icon-<%- icon %>"></i><span class="name"><%- label %></span></button>',
    events: {
      'click': 'clicked'
    },
    render: function () {
      this.$el.html(_.template(this.template, this.model.toJSON()));
    },
    clicked: function () {
      if (!this.model.get('action')) {
        return;
      }
      this.model.get('action')();
    }
  });

  MenuCard.View = Card.View.extend({
    initialize: function () {
      this.model.set('card', new Backbone.CollectionView({
        tagName: 'ul',
        className: 'dataflow-menu',
        collection: this.model.menu,
        itemView: MenuItemView
      }));
      Card.View.prototype.initialize.call(this);
    }
  });
}(Dataflow));

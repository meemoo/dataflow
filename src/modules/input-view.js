( function(Input) {

  var template = 
    '<span class="plug"></span>'+
    '<span class="hole"></span>'+
    '<span class="label"><%= id %></span>';
 
  Input.Views.Main = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port in",
    initialize: function() {
      this.$el.addClass(this.model.get("type"));
      // this.$(".plug").draggable();
      // this.$(".hole").draggable();
    },
    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
    },
    holePosition: function () {
      return this.$(".hole").offset();
    }
  });

  Input.Views.Collection = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.Views.Main
  }); 

}(Dataflow.module("input")) );

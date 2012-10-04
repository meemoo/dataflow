( function(Input) {

  var template = 
    '<span class="plug"></span>'+
    '<span class="hole"></span>'+
    '<span class="label"><%= label %></span>';
 
  Input.Views.Main = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port in",
    initialize: function() {
      this.$el.addClass(this.model.get("type"));
    },
    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
    }
  });

  Input.Views.Collection = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.Views.Main
  }); 

}(Dataflow.module("input")) );

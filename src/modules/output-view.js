( function(Output) {
 
  var template = 
    '<span class="label"><%= label %></span>'+
    '<span class="hole"></span>'+
    '<span class="plug"></span>';

  Output.Views.Main = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port out",
    initialize: function() {
      this.$el.addClass(this.model.get("type"));
    },
    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
    }
  });

  Output.Views.Collection = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Output.Views.Main
  }); 

}(Dataflow.module("output")) );

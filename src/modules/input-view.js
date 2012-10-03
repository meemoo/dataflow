( function(Input) {

  // var template = 
  //   '<span><%= label %></span>';
 
  Input.Views.Main = Backbone.View.extend({
    // template: _.template(template),
    className: "input",
    initialize: function() {
      
    }
    // render: function() {
    //   // this.$el.html(this.template(this.model.toJSON()));
    // }
  });

}(Dataflow.module("input")) );

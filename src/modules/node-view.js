( function(Node) {

  var template = 
    '<h1><%= id %></h1>'+
    '<div class="ins" />'+
    '<div class="outs" />';

  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  Node.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "node",
    initialize: function() {
      // Initialize i/o views
      this.model.inputs.each(function(input){
        input.view = new Input.Views.Main({model:input});
      }, this);
      this.model.outputs.each(function(output){
        output.view = new Output.Views.Main({model:output});
      }, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      // Render i/o views
      this.model.inputs.each(function(input){
        this.$(".ins").append(input.view.render().el);
      }, this);
      this.model.outputs.each(function(output){
        this.$(".outs").append(output.view.render().el);
      }, this);

      return this;
    }
  });

}(Dataflow.module("node")) );

( function(Node) {

  var template = 
    '<h1><%= id %></h1>'+
    '<div class="ports ins" />'+
    '<div class="ports outs" />';

  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  Node.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "node",
    initialize: function() {
      // Initialize i/o views
      this.model.inputs.view = new Input.Views.Collection({
        collection: this.model.inputs
      });
      this.model.inputs.view.render();
      this.model.inputs.view.renderAllItems();
      //
      this.model.outputs.view = new Output.Views.Collection({
        collection: this.model.outputs
      });
      this.model.outputs.view.render();
      this.model.outputs.view.renderAllItems();

      this.$el.draggable();
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      this.$(".ins").html(this.model.inputs.view.el);
      this.$(".outs").html(this.model.outputs.view.el);

      return this;
    }
  });

  Node.Views.Collection = Backbone.CollectionView.extend({
    itemView: Node.Views.Main
  }); 

}(Dataflow.module("node")) );

( function(Node) {

  var template = 
    '<h1><%= id %>: <%= label %></h1>'+
    '<div class="controls">'+
      '<button class="delete">delete</button>'+
    '</div>'+
    '<div class="ports ins" />'+
    '<div class="ports outs" />';

  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  Node.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "node",
    events: {
      "click .delete": "deleteMe",
      "dragstop":      "dragStop"
    },
    initialize: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

      // Initialize i/o views
      this.model.inputs.view = new Input.Views.Collection({
        collection: this.model.inputs
      });
      this.model.inputs.view.render();
      this.model.inputs.view.renderAllItems();
      this.inputs = this.model.inputs.view;
      //
      this.model.outputs.view = new Output.Views.Collection({
        collection: this.model.outputs
      });
      this.model.outputs.view.render();
      this.model.outputs.view.renderAllItems();
      this.outputs = this.model.outputs.view;

      var self = this;
      this.$el.draggable({
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="node helper" style="width:'+width+'px; height:'+height+'px">');
        }
      });
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      this.$(".ins").html(this.inputs.el);
      this.$(".outs").html(this.outputs.el);

      return this;
    },
    dragStop: function(event, ui){
      var x = parseInt(ui.position.left, 10);
      var y = parseInt(ui.position.top, 10);
      this.$el.css({
        left: x,
        top: y
      });
      this.model.set({
        x: x,
        y: y
      });
      this.model.collection.sort();
      this.model.trigger("move");
    },
    deleteMe: function(){
      this.model.collection.remove(this.model);
    }
  });

  Node.Views.Collection = Backbone.CollectionView.extend({
    itemView: Node.Views.Main
  }); 

}(Dataflow.module("node")) );

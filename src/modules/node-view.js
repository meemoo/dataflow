( function(Node) {

  var template = 
    '<div class="outer" />'+
    '<h1 class="title"><%- id %>: <span class="label"><%- label %></span> <input class="label-edit" value="<%- label %>" type="text" /></h1>'+
    '<div class="controls">'+
      '<button class="delete">delete</button>'+
      '<button class="save">save</button>'+
      '<button class="cancel">cancel</button>'+
    '</div>'+
    '<button class="edit">edit</button>'+
    '<div class="ports ins" />'+
    '<div class="ports outs" />'+
    '<div class="inner" />';

  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    className: "node",
    events: {
      "mousedown .title":  "select",
      "click .delete": "removeModel",
      "dragstop":      "dragStop",
      "click .edit":   "showControls",
      "click .cancel": "hideControls",
      "click .save":   "saveLabel"
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));

      // Add type class
      this.$el.addClass(this.model.type);

      // Initialize i/o views
      this.model.inputs.view = new Input.CollectionView({
        collection: this.model.inputs
      });
      this.model.inputs.view.render();
      this.model.inputs.view.renderAllItems();
      this.inputs = this.model.inputs.view;
      // Outs
      this.model.outputs.view = new Output.CollectionView({
        collection: this.model.outputs
      });
      this.model.outputs.view.render();
      this.model.outputs.view.renderAllItems();
      this.outputs = this.model.outputs.view;

      var self = this;
      this.$el.draggable({
        handle: "h1",
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="node helper" style="width:'+width+'px; height:'+height+'px">');
        }
      });
    },
    render: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

      this.$(".ins").html(this.inputs.el);
      this.$(".outs").html(this.outputs.el);

      // Hide controls
      this.$(".controls").hide();
      this.$(".title .label-edit").hide();

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
      this.model.collection.sort({silent: true});
    },
    showControls: function(){
      // Show label edit
      this.$(".title .label").hide();
      this.$(".title .label-edit").show();
      // Show controls
      this.$(".edit").hide();
      this.$(".controls").show();
    },
    hideControls: function(){
      // Hide label edit
      this.$(".title .label-edit").hide();
      this.$(".title .label").show();
      // Hide controls
      this.$(".controls").hide();
      this.$(".edit").show();
    },
    saveLabel: function(){
      // Save new label
      var newLabel = this.$(".title .label-edit").val();
      if (this.model.get("label") !== newLabel) {
        this.model.set("label", newLabel);
        this.$(".title .label").text(newLabel);
      }
      this.hideControls();
    },
    removeModel: function(){
      this.model.collection.remove(this.model);
    },
    select: function(event){
      if (event.ctrlKey || event.metaKey) {
        // Command key is pressed, toggle selection
        this.$el.toggleClass("selected");
      } else {
        // Command key isn't pressed, deselect others and select this one
        this.model.parentGraph.view.$(".selected").removeClass("selected");
        this.$el.addClass("selected");
      }
      
      // Don't fire click on graph
      // event.stopPropagation();
    }
  });

}(Dataflow.module("node")) );

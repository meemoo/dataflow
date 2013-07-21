( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  // Dependencies
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  var template = 
    '<div class="outer" />'+
    '<h1 class="dataflow-node-title"><span class="label"><%- label %></span> <input class="label-edit" value="<%- label %>" type="text" /></h1>'+
    // '<div class="dataflow-node-controls">'+
    //   '<button class="dataflow-node-delete">delete</button>'+
    //   '<button class="dataflow-node-save">save</button>'+
    //   '<button class="dataflow-node-cancel">cancel</button>'+
    // '</div>'+
    '<button title="properties" class="dataflow-node-edit icon-cog"></button>'+
    '<div class="dataflow-node-ports dataflow-node-ins" />'+
    '<div class="dataflow-node-ports dataflow-node-outs" />'+
    '<div class="dataflow-node-inner" />';

  var innerTemplate = "";
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    innerTemplate: _.template(innerTemplate),
    className: "dataflow-node",
    events: function(){
      return {
        "click .dataflow-node-title":  "select",
        "click .dataflow-node-delete": "removeModel",
        "dragstart":     "dragStart",
        "drag":          "drag",
        "dragstop":      "dragStop",
        "click .dataflow-node-edit":   "showControls",
        "click .dataflow-node-cancel": "hideControls",
        "click .dataflow-node-save":   "saveLabel"
      };
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));

      // Add type class
      this.$el.addClass(this.model.type);

      if (!this.model.parentGraph.dataflow.editable) {
        // No edit name
        this.$(".dataflow-node-edit").hide();
      }

      // Initialize i/o views
      this.inputs = this.model.inputs.view = new Input.CollectionView({
        collection: this.model.inputs
      });
      // Outs
      this.outputs = this.model.outputs.view = new Output.CollectionView({
        collection: this.model.outputs
      });

      var self = this;
      this.$el.draggable({
        handle: "h1",
        // grid: [ 5, 5 ],
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="dataflow-node helper" style="width:'+width+'px; height:'+height+'px">');
        }
      });

      this.$el.data("dataflow-node-view", this);

      // Inner template
      this.$(".dataflow-node-inner").append(this.innerTemplate);

      // Listener to reset inputs list
      // this.inputs.on("change", function(input){
      //   this.$inputsList = null;
      //   console.log("change");
      // }, this);
    },
    render: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

      this.$(".dataflow-node-ins").html(this.inputs.el);
      this.$(".dataflow-node-outs").html(this.outputs.el);

      // Hide controls
      this.$(".dataflow-node-controls").hide();
      this.$(".label-edit").hide();

      return this;
    },
    _alsoDrag: [],
    _dragDelta: {},
    dragStart: function(event, ui){
      // Select this
      if (!this.$el.hasClass("ui-selected")){
        this.select(event);
      }

      // Make helper and save start position of all other selected
      var self = this;
      this._alsoDrag = [];
      this.model.parentGraph.view.$(".ui-selected").each(function() {
        if (self.el !== this) {
          var el = $(this);
          var position = {
            left: parseInt(el.css('left'), 10), 
            top: parseInt(el.css('top'), 10)
          };
          el.data("ui-draggable-alsodrag-initial", position);
          // Add helper
          var helper = $('<div class="node helper">').css({
            width: el.width(),
            height: el.height(),
            left: position.left,
            top: position.top
          });
          el.parent().append(helper);
          el.data("ui-draggable-alsodrag-helper", helper);
          // Add to array
          self._alsoDrag.push(el);
        }
      });
    },
    drag: function(event, ui){
      // Drag other helpers
      if (this._alsoDrag.length) {
        var self = $(event.target).data("ui-draggable");
        var op = self.originalPosition;
        var delta = {
          top: (self.position.top - op.top) || 0, 
          left: (self.position.left - op.left) || 0
        };

        _.each(this._alsoDrag, function(el){
          var initial = el.data("ui-draggable-alsodrag-initial");
          var helper = el.data("ui-draggable-alsodrag-helper");
          helper.css({
            left: initial.left + delta.left,
            top: initial.top + delta.top
          });
        });
      }
    },
    dragStop: function(event, ui){
      var x = parseInt(ui.position.left, 10);
      var y = parseInt(ui.position.top, 10);
      this.moveToPosition(x,y);
      // Also drag
      if (this._alsoDrag.length) {
        _.each(this._alsoDrag, function(el){
          var initial = el.data("ui-draggable-alsodrag-initial");
          var helper = el.data("ui-draggable-alsodrag-helper");
          var node = el.data("dataflow-node-view");
          // Move other node
          node.moveToPosition(parseInt(helper.css("left"), 10), parseInt(helper.css("top"), 10));
          // Remove helper
          helper.remove();
          el.data("ui-draggable-alsodrag-initial", null);
          el.data("ui-draggable-alsodrag-helper", null);
        });
        this._alsoDrag = [];
      }
    },
    moveToPosition: function(x, y){
      x = Math.max(x, 0);
      y = Math.max(y, 0);
      this.$el.css({
        left: x,
        top: y
      });
      this.model.set({
        x: x,
        y: y
      });
    },
    showControls: function(){
      // Show label edit
      this.$(".dataflow-node-title .label").hide();
      this.$(".dataflow-node-title .label-edit").show();
      // Show controls
      this.$(".dataflow-node-edit").hide();
      this.$(".dataflow-node-controls").show();
    },
    hideControls: function(){
      // Hide label edit
      this.$(".dataflow-node-title .label-edit").hide();
      this.$(".dataflow-node-title .label").show();
      // Hide controls
      this.$(".dataflow-node-controls").hide();
      this.$(".dataflow-node-edit").show();
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
      this.model.remove();
    },
    bringToTop: function () {
      var topZ = 0;
      this.model.collection.each(function(node){
        var thisZ = parseInt(node.view.el.style.zIndex, 10);
        if (thisZ > topZ) {
          topZ = thisZ;
        }
      }, this);
      this.el.style.zIndex = topZ+1;
    },
    select: function(event){
      if (event) {
        // Don't click graph
        event.stopPropagation();
        // Called from click
        if (event.ctrlKey || event.metaKey) {
          // Command key is pressed, toggle selection
          this.$el.toggleClass("ui-selected");
        } else {
          // Command key isn't pressed, deselect others and select this one
          this.model.parentGraph.view.$(".ui-selected").removeClass("ui-selected");
          this.$el.addClass("ui-selected");
        }
        // Bring to top
        this.bringToTop();
      } else {
        // Called from code
        this.$el.addClass("ui-selected");
        this.bringToTop();
      }
      // Trigger
      if ( this.$el.hasClass("ui-selected") ) {
        this.model.trigger("select");
      }
      this.model.parentGraph.trigger("selectionChanged");
    },
    $inputList: null,
    getInputList: function() {
      if (!this.$inputList) {
        this.$inputList = $("<div>");
        this.model.inputs.each(function(input){
          if (input.view && input.view.$input) {
            this.$inputList.append( input.view.$input );
          }
        }, this);
      }
      return this.$inputList;
    }
  });

}(Dataflow) );

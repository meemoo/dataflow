( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  // Dependencies
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  var template = 
    '<div class="outer" />'+
    '<div class="dataflow-node-header">'+
      '<h1 class="dataflow-node-title"><span class="label"><%- label %></span> <input class="label-edit" value="<%- label %>" type="text" /></h1>'+
      '<button title="properties" class="dataflow-node-inspect icon-cog"></button>'+
    '</div>'+
    '<div class="dataflow-node-ports">'+
      '<div class="dataflow-node-ins"></div>'+
      '<div class="dataflow-node-outs"></div>'+
      '<div style="clear:both;"></div>'+
    '</div>'+
    '<div class="dataflow-node-inner"></div>';

  var inspectTemplate = 
    '<h1 class="dataflow-node-inspector-title"><%- label %></h1>'+
    // '<div class="dataflow-node-inspector-controls">'+
    //   '<button class="dataflow-node-delete">delete</button>'+
    //   '<button class="dataflow-node-save">save</button>'+
    //   '<button class="dataflow-node-cancel">cancel</button>'+
    // '</div>'+
    '<div class="dataflow-node-inspector-inputs"></div>';

  var innerTemplate = "";

  var zoom;
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    innerTemplate: _.template(innerTemplate),
    inspectTemplate: _.template(inspectTemplate),
    className: "dataflow-node",
    events: function(){
      return {
        "click .dataflow-node-inspect": "showInspector",
        "click .dataflow-node-header":  "select"
        // "mousedown .dataflow-node-title": "dragStart",
        // "mousemove .dataflow-node-title": "drag",
        // "mouseup .dataflow-node-title":   "dragEnd"
      };
    },
    initialize: function(options) {
      this.$el.html(this.template(this.model.toJSON()));

      this.graph = options.graph;

      // Add type class
      this.$el.addClass(this.model.type);

      if (!this.model.parentGraph.dataflow.editable) {
        // No edit name
        this.$(".dataflow-node-edit").hide();
      }

      // Initialize i/o views
      this.inputs = this.model.inputs.view = new Input.CollectionView({
        collection: this.model.inputs,
        parent: this
      });
      // Outs
      this.outputs = this.model.outputs.view = new Output.CollectionView({
        collection: this.model.outputs,
        parent: this
      });

      this.makeDraggable();
      
      this.$el.data("dataflow-node-view", this);

      // Inner template
      this.$(".dataflow-node-inner").append(this.innerTemplate);

      // Listener to reset inputs list
      // this.inputs.on("change", function(input){
      //   this.$inputsList = null;
      //   console.log("change");
      // }, this);

      // Listen for graph panning
      this.listenTo(this.model.parentGraph, "change:panX change:panY", this.bumpPosition);

      this.$inner = this.$(".dataflow-node-inner");
    },
    render: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x") + this.model.parentGraph.get("panX"),
        top: this.model.get("y") + this.model.parentGraph.get("panY")
      });

      this.$(".dataflow-node-ins").html(this.inputs.el);
      this.$(".dataflow-node-outs").html(this.outputs.el);

      // Hide controls
      this.$(".dataflow-node-controls").hide();
      this.$(".label-edit").hide();

      return this;
    },
    makeDraggable: function(){
      var startX, startY, deltaX, deltaY, alsoDrag, $dragHelpers, isDragging, dragStarted;
      var self = this;

      function mouseDown(event) {
        startX = event.clientX;
        startY = event.clientY;
        isDragging = true;
      }

      function mouseUp(event) {
        isDragging = false;
      }

      function dragStart(event) {
        // Don't drag graph
        event.stopPropagation();

        dragStarted = true;

        // Select this
        if (!self.$el.hasClass("ui-selected")){
          self.select(event, true);
        }

        // Current zoom
        zoom = self.model.parentGraph.get('zoom');

        // Make helper and save start position of all other selected
        alsoDrag = [];

        $dragHelpers = $('<div class="dataflow-nodes-helpers"></div>');
        self.$el.parent().append( $dragHelpers );

        var helper = $('<div class="dataflow-node helper">').css({
          width: self.$el.width(),
          height: self.$el.height(),
          left: parseInt(self.$el.css('left'), 10),
          top: parseInt(self.$el.css('top'), 10)
        });
        $dragHelpers.append(helper);

        self.model.parentGraph.view.$(".ui-selected").each(function() {
          if (self.el !== this) {
            var el = $(this);
            // Add helper
            var helper = $('<div class="dataflow-node helper">').css({
              width: el.width(),
              height: el.height(),
              left: parseInt(el.css('left'), 10),
              top: parseInt(el.css('top'), 10)
            });
            $dragHelpers.append(helper);
            el.data("ui-draggable-alsodrag-helper", helper);
            // Add to array
            alsoDrag.push(el);
          }
        });
      }

      function drag(event) {
        if (!isDragging) { return; }
        if (!dragStarted) {
          dragStart(event);
        }
        // Don't drag graph
        event.stopPropagation();

        deltaX = (event.clientX - startX) / zoom;
        deltaY = (event.clientY - startY) / zoom;
        $dragHelpers.css({
          transform: "translate3d(" + deltaX + "px," + deltaY + "px,0)"
        });
      }

      function dragEnd(event) {
        // Don't drag graph
        event.stopPropagation();

        isDragging = false;

        if (!dragStarted) { return; }
        dragStarted = false;

        var panX = self.model.parentGraph.get("panX");
        var panY = self.model.parentGraph.get("panY");
        self.moveToPosition(self.model.get("x") + deltaX, self.model.get("y") + deltaY);
        // Also drag
        if (alsoDrag.length > 0) {
          _.each(alsoDrag, function(el){
            var initial = el.data("ui-draggable-alsodrag-initial");
            var helper = el.data("ui-draggable-alsodrag-helper");
            var node = el.data("dataflow-node-view");
            // Move other node
            node.moveToPosition(node.model.get("x") + deltaX, node.model.get("y") + deltaY);
            el.data("ui-draggable-alsodrag-helper", null);
          });
          alsoDrag = [];
        }
        // Remove helpers
        $dragHelpers.remove();
      }

      // Bind
      this.$(".dataflow-node-title")
        .mousedown(mouseDown)
        .mouseup(mouseUp);

      this.graph.$el
        .mousemove(drag)
        .mouseup(dragEnd);

    },
    bumpPosition: function () {
      this.$el.css({
        left: this.model.get("x") + this.model.parentGraph.get("panX"),
        top: this.model.get("y") + this.model.parentGraph.get("panY")
      });
      this.model.trigger("change:x change:y");
    },
    moveToPosition: function(x, y){
      this.model.set({
        x: x,
        y: y
      }, {
        // Don't trigger wire move until bumped
        silent: true
      });
      this.bumpPosition();
    },
    showInspector: function(){
      this.model.parentGraph.dataflow.showMenu("inspector");
      var $inspector = this.model.parentGraph.dataflow.$(".dataflow-plugin-inspector");
      $inspector.children().detach();
      $inspector.append( this.getInputList() );
      
      this.highlightEdges();
    },
    highlightEdges: function(){
      
    },
    hideControls: function(){
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
    select: function(event, deselectOthers){
      // Don't click graph
      if (event) {
        event.stopPropagation();
      }
      // De/select
      if (deselectOthers) {
        this.model.parentGraph.view.$(".ui-selected").removeClass("ui-selected");
      }
      this.$el.addClass("ui-selected");
      this.bringToTop();
      // Fade / highlight
      this.model.parentGraph.view.fade();
      this.unfade();
      // Trigger
      this.model.trigger("select");
      this.model.parentGraph.trigger("selectionChanged");
    },
    fade: function(){
      this.$el.addClass("fade");
    },
    unfade: function(){
      this.$el.removeClass("fade");
      // Unfade related edges
      var self = this;
      this.model.parentGraph.edges.each(function(edge){
        if (edge.source.parentNode.id === self.model.id || edge.target.parentNode.id === self.model.id) {
          if (edge.view) {
            edge.view.unfade();
          }
        }
      });
    },
    $inputList: null,
    getInputList: function() {
      if (!this.$inputList) {
        this.$inputList = $("<div>");
        var model = this.model.toJSON();
        this.$inputList.html( this.inspectTemplate(model) );
        if (model.id !== model.label) {
          this.$inputList.children(".dataflow-node-inspector-title").prepend(model.id + ": ");
        }
        var $inputs = this.$inputList.children(".dataflow-node-inspector-inputs");
        this.model.inputs.each(function(input){
          if (input.view && input.view.$input) {
            $inputs.append( input.view.$input );
          }
        }, this);
      }
      return this.$inputList;
    }
  });

}(Dataflow) );

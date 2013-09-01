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
        "click .dataflow-node-header":  "select",
        "dragstart": "dragStart",
        "drag":      "drag",
        "dragstop":  "dragStop"
        // "click .dataflow-node-delete": "removeModel",
        // "click .dataflow-node-cancel": "hideControls",
        // "click .dataflow-node-save":   "saveLabel"
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

      var self = this;
      this.$el.draggable({
        handle: "h1",
        helper: function(){
          return $('<div>');
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

      // Listen for graph panning
      this.listenTo(this.model.parentGraph, "change:panX change:panY", this.bumpPosition);

      // Selected listener
      this.listenTo(this.model, "change:selected", this.selectedChanged);

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
    _alsoDrag: [],
    _dragDelta: {},
    $dragHelpers: $('<div class="dataflow-nodes-helpers">'),
    dragStart: function(event, ui){
      if (!ui){ return; }
      // Select this
      if (!this.model.get("selected")){
        this.select(event, true);
      }

      // Don't drag graph
      event.stopPropagation();

      // Current zoom
      zoom = this.model.parentGraph.get('zoom');

      this.$dragHelpers.css({
        transform: "translate3d(0,0,0)"
      });
      this.$el.parent().append( this.$dragHelpers );

      // Make helper and save start position of all other selected
      var self = this;
      this._alsoDrag = this.model.collection.where({selected:true});

      _.each(this._alsoDrag, function(node){
        var $el = node.view.$el;
        // Add helper
        var helper = $('<div class="dataflow-node helper">').css({
          width: $el.width(),
          height: $el.height(),
          left: parseInt($el.css('left'), 10),
          top: parseInt($el.css('top'), 10)
        });
        this.$dragHelpers.append(helper);
      }, this);

    },
    drag: function(event, ui){
      if (!ui){ return; }
      // Don't drag graph
      event.stopPropagation();

      var x = (ui.position.left - ui.originalPosition.left) / zoom;
      var y = (ui.position.top - ui.originalPosition.top) / zoom;
      this.$dragHelpers.css({
        transform: "translate3d("+x+"px,"+y+"px,0)"
      });
    },
    dragStop: function(event, ui){
      if (!ui){ return; }
      // Don't drag graph
      event.stopPropagation();

      var panX = this.model.parentGraph.get("panX");
      var panY = this.model.parentGraph.get("panY");
      var deltaX = (ui.position.left - ui.originalPosition.left) / zoom;
      var deltaY = (ui.position.top - ui.originalPosition.top) / zoom;
      // this.moveToPosition(this.model.get("x") + deltaX, this.model.get("y") + deltaY);
      // Also drag
      if (this._alsoDrag.length) {
        _.each(this._alsoDrag, function(node){
          node.view.moveToPosition(node.get("x") + deltaX, node.get("y") + deltaY);
        }, this);
        this._alsoDrag = [];
      }
      // Remove helpers
      this.$dragHelpers.empty();
      this.$dragHelpers.remove();
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
      var toggle = false;
      var selected = this.model.get("selected");
      if (event && (event.ctrlKey || event.metaKey)) {
        toggle = true;
        selected = !selected;
        this.model.set("selected", selected);
        if (!selected) {
          this.fade();
        }
      } else {
        // Deselect all
        this.model.parentGraph.nodes.invoke("set",{selected:false});
        this.model.parentGraph.view.fade();
        selected = true;
        this.model.set("selected", true);
      }
      this.bringToTop();
      this.model.parentGraph.view.fadeEdges();
      this.model.parentGraph.trigger("selectionChanged");
    },
    fade: function(){
      this.$el.addClass("fade");
      this.$el.removeClass("ui-selected");
    },
    unfade: function(){
      this.$el.removeClass("fade");
    },
    selectedChanged: function () {
      if (this.model.get("selected")) {
        this.highlight();
      } else {
        this.unhighlight();
      }
    },
    highlight: function () {
      this.$el.removeClass("fade");
      this.$el.addClass("ui-selected");
    },
    unhighlight: function () {
      this.$el.removeClass("ui-selected");
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

( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  // Dependencies
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  var headerTemplate =
    '<h1 class="dataflow-node-title" title="<%- label %>: <%- type %>">'+
    '<% if (icon) { %><i class="icon-<%- icon %>"></i> <% } %>'+
    '<%- label %></h1>';

  var template = 
    '<div class="outer" />'+
    '<div class="dataflow-node-header">'+
      headerTemplate +
    '</div>'+
    '<div class="dataflow-node-ports">'+
      '<div class="dataflow-node-ins"></div>'+
      '<div class="dataflow-node-outs"></div>'+
      '<div style="clear:both;"></div>'+
    '</div>'+
    '<div class="dataflow-node-inner"></div>';

  var innerTemplate = "";

  var zoom;
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    innerTemplate: _.template(innerTemplate),
    className: "dataflow-node",
    events: function(){
      return {
        "click .dataflow-node-header":  "select",
        "dragstart": "dragStart",
        "drag":      "drag",
        "dragstop":  "dragStop"
      };
    },
    initialize: function(options) {
      var templateData = this.model.toJSON();
      templateData.icon = this.model.getIcon();
      this.$el.html(this.template(templateData));

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
      // }, this);

      // Listen for graph panning
      this.listenTo(this.model.parentGraph, "change:panX change:panY", this.bumpPosition);

      // Selected listener
      this.listenTo(this.model, "change:selected", this.selectedChanged);

      this.listenTo(this.model, "change:label change:icon", this.changeHeader);

      this.listenTo(this.model, "remove", this.hideInspector);

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
    changeHeader: function () {
      var templateData = this.model.toJSON();
      templateData.icon = this.model.getIcon();
      this.$(".dataflow-node-header")
        .html(_.template(headerTemplate, templateData));
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
        this.model.parentGraph.edges.invoke("set", {selected:false});
        this.model.parentGraph.nodes.invoke("set", {selected:false});
        this.model.parentGraph.view.fade();
        selected = true;
        this.model.set("selected", true);
      }
      this.bringToTop();
      this.model.parentGraph.view.fadeEdges();
      this.model.parentGraph.trigger("selectionChanged");
    },
    inspector: null,
    getInspector: function () {
      if (!this.inspector) {
        var inspect = new Node.InspectView({model:this.model});
        var Card = Dataflow.prototype.module("card");
        this.inspector = new Card.Model({
          dataflow: this.model.parentGraph.dataflow,
          card: inspect
        });
      }
      return this.inspector;
    },
    showInspector: function(leaveUnpinned){
      this.model.parentGraph.dataflow.addCard( this.getInspector(), leaveUnpinned );
    },
    hideInspector: function () {
      this.model.parentGraph.dataflow.removeCard( this.getInspector() );
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
        this.showInspector();
      } else {
        this.unhighlight();
        this.hideInspector();
      }
    },
    highlight: function () {
      this.$el.removeClass("fade");
      this.$el.addClass("ui-selected");
    },
    unhighlight: function () {
      this.$el.removeClass("ui-selected");
    }//,
    // $inputList: null,
    // getInputList: function() {
    //   if (!this.$inputList) {
    //     this.$inputList = $("<div>");
    //     var model = this.model.toJSON();
    //     this.$inputList.html( this.inspectTemplate(model) );
    //     if (model.id !== model.label) {
    //       this.$inputList.children(".dataflow-node-inspector-title").prepend(model.id + ": ");
    //     }
    //     var $inputs = this.$inputList.children(".dataflow-node-inspector-inputs");
    //     this.model.inputs.each(function(input){
    //       if (input.view && input.view.$input) {
    //         $inputs.append( input.view.$input );
    //       }
    //     }, this);
    //   }
    //   return this.$inputList;
    // }
  });

}(Dataflow) );

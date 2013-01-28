( function(Input) {

  var Edge = Dataflow.module("edge");

  var template = 
    '<span class="plug in" title="drag to edit wire"></span>'+ //i18n
    '<span class="hole in" title="drag to make new wire"></span>'+ //i18n
    '<span class="input-container in"></span>'+
    '<span class="label in"><%= label %></span>';
 
  Input.View = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port in",
    events: {
      "dragstart .hole":  "newEdgeStart",
      "drag      .hole":  "newEdgeDrag",
      "dragstop  .hole":  "newEdgeStop",
      "click     .plug":  "highlightEdge",
      "dragstart .plug":  "changeEdgeStart",
      "drag      .plug":  "changeEdgeDrag",
      "dragstop  .plug":  "changeEdgeStop",
      "drop":             "connectEdge",
      "change .input-int":     "inputInt",
      "change .input-float":   "inputFloat",
      "change .input-string":  "inputString",
      "change .input-boolean": "inputBoolean",
      "click  .input-bang":    "inputBang"
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));
      var self = this;
      this.$(".plug").draggable({
        helper: function(){
          return $('<span class="plug in helper" />');
        },
        disabled: true,
        // To prevent accidental disconnects
        distance: 10,
        delay: 100
      });
      this.$(".hole").draggable({
        helper: function(){
          return $('<span class="plug out helper" />')
            .data({port: self.model});
        }
      });
      this.$el.droppable({
        accept: ".plug.in, .hole.out",
        activeClassType: "droppable-hover"
      });

      // Initialize direct input
      var input;
      var type = this.model.get("type");
      var state = this.model.parentNode.get("state");
      if (type === "int" || type === "float") {
        var attributes = {};
        if (this.model.get("min") !== undefined) {
          attributes.min = this.model.get("min");
        }
        if (this.model.get("max") !== undefined) {
          attributes.max = this.model.get("max");
        }
        if (type === "int") {
          attributes.step = 1;
        }
        input = $('<input type="number" class="input input-number">')
          .attr(attributes)
          .addClass(type === "int" ? "input-int" : "input-float");
        if (state && state[this.model.id] !== undefined){
          // Use the stored state
          input.val(state[this.model.id]);
        } else if (this.model.get("value") !== undefined) {
          // Use the default
          input.val(this.model.get("value"));
        }
      } else if (type === "string") {
        input = $('<input class="input input-string">');
        if (state && state[this.model.id] !== undefined){
          // Use the stored state
          input.val(state[this.model.id]);
        } else if (this.model.get("value") !== undefined) {
          // Use the default
          input.val(this.model.get("value"));
        }
      } else if (type === "boolean") {
        input = $('<input type="checkbox" class="input input-boolean">');
        if (state && state[this.model.id] !== undefined){
          // Use the stored state
          input.prop("checked", state[this.model.id]);
        } else if (this.model.get("value") !== undefined) {
          // Use the default
          input.prop("checked", this.model.get("value"));
        }
      } else if (type === "bang") {
        input = $('<button class="input input-bang">!</button>');
      } 
      if (input) {
        this.$(".input-container").append(input);
      }
    },
    inputInt: function(e){
      this.model.parentNode.setState(this.model.id, parseInt($(e.target).val(), 10));
    },
    inputFloat: function(e){
      this.model.parentNode.setState(this.model.id, parseFloat($(e.target).val()));
    },
    inputString: function(e){
      this.model.parentNode.setState(this.model.id, $(e.target).val());
    },
    inputBoolean: function(e){
      this.model.parentNode.setState(this.model.id, $(e.target).prop("checked"));
    },
    inputBang: function(){
      this.model.parentNode.setBang(this.model.id);
    },
    render: function(){
      return this;
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeNew = new Edge.Model({
        target: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        parentGraph: this.model.parentNode.parentGraph,
        preview: true
      });
      this.previewEdgeNewView = new Edge.View({
        model: this.previewEdgeNew
      });
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeNewView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeNewView.render(ui.offset);
      this.model.parentNode.parentGraph.view.sizeSVG();
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeNewView.remove();
      delete this.previewEdgeNew;
      delete this.previewEdgeNewView;
    },
    highlightEdge: function() {
      if (this.isConnected){
      }
    },
    changeEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge;
        // Will get the last (top) matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          if(edge.target === this.model){
            changeEdge = edge;
          }
        }, this);
        if (changeEdge){
          // Remove edge
          changeEdge.collection.remove(changeEdge);

          // Make preview
          ui.helper.data({
            port: changeEdge.source
          });
          this.previewEdgeChange = new Edge.Model({
            source: changeEdge.get("source"),
            parentGraph: this.model.parentNode.parentGraph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.View({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.parentNode.parentGraph.view.sizeSVG();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;
      this.model.parentNode.parentGraph.edges.add({
        id: otherPort.parentNode.id+":"+otherPort.id+"→"+this.model.parentNode.id+":"+this.model.id,
        parentGraph: this.model.parentNode.parentGraph,
        source: {
          node: otherPort.parentNode.id,
          port: otherPort.id
        },
        target: {
          node: this.model.parentNode.id,
          port: this.model.id
        }
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.parentNode.parentGraph.edges.length));
    },
    holePosition: function(){
      return this.$(".hole").offset();
    },
    isConnected: false,
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.target === this.model);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Input.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.View
  }); 

}(Dataflow.module("input")) );

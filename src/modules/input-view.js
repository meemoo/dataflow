( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");

  // Dependencies
  var Edge = Dataflow.prototype.module("edge");

  var template = 
    '<span class="dataflow-port-plug in" title="drag to edit wire"></span>'+ //i18n
    '<span class="dataflow-port-hole in" title="drag to make new wire"></span>'+ //i18n
    '<label class="dataflow-port-label in" title="<%= description %>">'+
      '<%= label %>'+
    '</label>';  
 
  Input.View = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "dataflow-port dataflow-in",
    events: {
      "click":  "getTopEdge",
      "drop":   "connectEdge",
      "dragstart .dataflow-port-hole":  "newEdgeStart",
      "drag      .dataflow-port-hole":  "newEdgeDrag",
      "dragstop  .dataflow-port-hole":  "newEdgeStop",
      "dragstart .dataflow-port-plug":  "changeEdgeStart",
      "drag      .dataflow-port-plug":  "changeEdgeDrag",
      "dragstop  .dataflow-port-plug":  "changeEdgeStop"
    },
    $input: null,
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));

      if (!this.model.parentNode.parentGraph.dataflow.editable) {
        // No drag and drop
        return;
      }

      var self = this;
      this.$(".dataflow-port-plug").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug in helper" />');
          $(document.body).append(helper);
          return helper;
        },
        disabled: true,
        // To prevent accidental disconnects
        distance: 10,
        delay: 100
      });
      this.$(".dataflow-port-hole").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug out helper" />')
            .data({port: self.model});
          $(document.body).append(helper);
          return helper;
        }
      });
      this.$el.droppable({
        accept: ".dataflow-port-plug.in, .dataflow-port-hole.out",
        activeClassType: "droppable-hover"
      });

      if (!this.model.parentNode.parentGraph.dataflow.inputs) {
        // No direct inputs
        return;
      }

      // Initialize direct input
      var input;
      var type = this.model.get("type");
      var state = this.model.parentNode.get("state");
      var options = this.model.get("options");
      if (options !== undefined) {
        // Select dropdown
        // Find default
        var val;
        if (state && state[this.model.id] !== undefined){
          // Use the stored state
          val = state[this.model.id];
        } else if (this.model.get("value") !== undefined) {
          // Use the default
          val = this.model.get("value");
        }
        // Convert options
        if (typeof options === "string") {
          options = options.split(" ");
        }
        if ($.isArray(options)){
          // Convert array to object
          var o = {};
          for (var i=0; i<options.length; i++){
            o[options[i]] = options[i];
          }
          options = o;
        }
        // Make select
        input = $('<select class="input input-select">');
        for (var name in options) {
          var option = $('<option value="'+options[name]+'">'+name+'</option>')
            .data("val", options[name]);
          if (val && options[name] === val) {
            option.prop("selected", true);
          }
          input.append(option);
        }
        // Change event
        input.change(function(event){
          self.inputSelect(event);
        });
      } else if (type === "int" || type === "float" || type === "number") {
        // Number input
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
        // Change event
        if (type === "int") {
          input.change(function(event){
            self.inputInt(event);
          });
        } else {
          input.change(function(event){
            self.inputFloat(event);
          });
        }
      } else if (type === "string" || type === "all") {
        // String input
        input = $('<input class="input input-string">');
        if (state && state[this.model.id] !== undefined){
          // Use the stored state
          input.val(state[this.model.id]);
        } else if (this.model.get("value") !== undefined) {
          // Use the default
          input.val(this.model.get("value"));
        }
        // Change event
        input.change(function(event){
          self.inputString(event);
        });
      } else if (type === "boolean") {
        // Checkbox boolean
        input = $('<input type="checkbox" class="input input-boolean">');
        if (state && state[this.model.id] !== undefined){
          // Use the stored state
          input.prop("checked", state[this.model.id]);
        } else if (this.model.get("value") !== undefined) {
          // Use the default
          input.prop("checked", this.model.get("value"));
        }
        // Change event
        input.change(function(event){
          self.inputBoolean(event);
        });
      } else if (type === "bang") {
        // Button bang
        input = $('<button class="input input-bang">!</button>');
        // Change event
        input.click(function(event){
          self.inputBang(event);
        });
      } 
      if (input) {
        var label = $("<label>")
          .append( input )
          .append( " " + this.model.get("label") );
        this.$input = label;
      }
    },
    inputSelect: function(e){
      var val = $(e.target).find(":selected").data("val");
      this.model.parentNode.setState(this.model.id, val);
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
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.dataflow-svg-edges')[0];
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
    getTopEdge: function() {
      var topEdge;
      if (this.isConnected){
        // Will get the last (top) matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          if(edge.target === this.model){
            topEdge = edge;
          }
          if (edge.view) {
            edge.view.unhighlight();
          }
        }, this);
        if (topEdge && topEdge.view) {
          topEdge.view.click();
        }
      }
      return topEdge;
    },
    changeEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.getTopEdge();
        if (changeEdge){
          // Remove edge
          changeEdge.remove();

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
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.dataflow-svg-edges')[0];
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

      if (otherPort.parentNode.parentGraph.dataflow !== this.model.parentNode.parentGraph.dataflow) {
        // from another widget
        return false;
      }

      this.model.parentNode.parentGraph.edges.add({
        id: otherPort.parentNode.id+":"+otherPort.id+"::"+this.model.parentNode.id+":"+this.model.id,
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
      var nodePos = this.model.parentNode.view.$el.position();
      var holePos = this.$(".dataflow-port-hole").position();
      return {
        left: nodePos.left + holePos.left + 5,
        top: nodePos.top + holePos.top + 8
      };
    },
    isConnected: false,
    plugSetActive: function(){
      try {
        this.$(".dataflow-port-plug").draggable("enable");
      } catch (e) { }
      this.$(".dataflow-port-plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.target === this.model);
      }, this);
      if (!isConnected) {
        try {
          this.$(".dataflow-port-plug").draggable("disable");
        } catch (e) { }
        this.$(".dataflow-port-plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Input.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.View
  }); 

}(Dataflow) );

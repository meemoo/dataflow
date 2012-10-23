( function(Edge) {

  // Thanks bobince http://stackoverflow.com/a/3642265/592125
  var makeSVG = function(tag, attrs) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (k === "xlink:href") {
        // Pssh namespaces...
        svg.setAttributeNS('http://www.w3.org/1999/xlink','href', attrs[k]);
      } else {
        svg.setAttribute(k, attrs[k]);
      }
    }
    return svg;
  };
  
  Edge.Views.Main = Backbone.View.extend({
    tagName: "div",
    className: "edge",
    positions: null,
    initialize: function() {
      this.positions = {
        from: null, 
        to: null
      };
      // Render on source/target view move
      if (this.model.source) {
        this.model.source.parentNode.on("move", this.render, this);
      }
      if (this.model.target) {
        this.model.target.parentNode.on("move", this.render, this);
      }
      // Set port plug active
      if (this.model.source) {
        this.model.source.view.plugSetActive();
      }
      if (this.model.target) {
        this.model.target.view.plugSetActive();
      }
      // Made SVG elements
      this.el = makeSVG("path", {
        "class": "path"
      });
      this.$el = $(this.el);
      // Add el to SVG
      var self = this;
      if (this.model.parentGraph) {
        _.defer(function(){
          self.model.parentGraph.view.$('.svg-edges')[0].appendChild(self.el);
        }, this);
      }

      // Click handler
      this.el.addEventListener("click", function(event){
        self.showEdit(event);
      });
    },
    render: function(previewPosition){
      var source = this.model.source;
      var target = this.model.target;
      if (source) {
        this.positions.from = source.view.holePosition();
      }
      else {
        // Preview 
        this.positions.from = previewPosition;
      }
      if (target) {
        this.positions.to = target.view.holePosition();
      } else {
        // Preview
        this.positions.to = previewPosition;
      }
      this.el.setAttribute("d", this.edgePath(this.positions));
      // Bounding box
      if (this.model.collection) {
        this.model.collection.view.sizeSvg();
      }
    },
    edgePath: function(positions){
      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+50) + " " + positions.from.top +
        " L " + (positions.to.left-50) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
      var source = this.model.source;
      var target = this.model.target;
      // Remove listeners
      if (source) {
        source.parentNode.off("move", this.render, this);
      }
      if (target) {
        target.parentNode.off("move", this.render, this);
      }
      // Check if port plug is still active
      if (source) {
        source.view.plugCheckActive();
      }
      if (target) {
        target.view.plugCheckActive();
      }
      // Remove element
      this.$el.remove();
    },
    showEdit: function(event){
      // Hide others
      $(".modal-bg").remove();

      // Show box 
      var modalBox = $('<div class="modal-bg" style="width:'+$(window).width()+'px; height:'+$(window).height()+'px;" />')
        .click(function(){
          $(".modal-bg").remove();
        });
      var editBox = $('<div class="edge-edit-box" style="left:'+event.pageX+'px; top:'+event.pageY+'px;" />');
      editBox.append(this.model.id+"<br />");
      var self = this;
      var deleteButton = $('<button>delete</button>')
        .click(function(){
          self.model.collection.remove(self.model);
          $(".modal-bg").remove();
        });
      editBox.append(deleteButton);
      modalBox.append(editBox);
      this.model.parentGraph.view.$el.append(modalBox);
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main,
    sizeSvg: function(){
      // TODO timeout to not do this with many edge resizes at once
      try{
        var svg = this.collection.parentGraph.view.$('.svg-edges')[0];
        var rect = svg.getBBox();
        svg.setAttribute("width", Math.round(rect.x+rect.width+50));
        svg.setAttribute("height", Math.round(rect.y+rect.height+50));
      } catch (error) {}
    }
  }); 

}(Dataflow.module("edge")) );

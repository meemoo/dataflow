( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  var template = 
    '<h1 class="dataflow-plugin-inspector-title">Edge</h1>'+
    '<div class="dataflow-edge-inspector-route-choose"></div>';
  
  Edge.InspectView = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge-inspector",
    positions: null,
    template: _.template(template),
    initialize: function() {
      this.$el.html( this.template(this.model) );

      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");

      var changeRoute = function(event){
        var route = $(event.target).data("route");
        this.model.set("route", route);
      }.bind(this);
      
      for (var i=0; i<12; i++) {
        var button = $("<button>")
          .data("route", i)
          .addClass("route"+i)
          .click(changeRoute);
        if (i === this.model.get("route")){
          button.addClass("active");
        }
        $choose.append(button);
      }

      this.listenTo(this.model, "change:route", this.render);
    },
    render: function(){
      var route = this.model.get("route");
      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");
      $choose.children(".active").removeClass("active");
      $choose.children(".route"+route).addClass("active");

      return this;
    },
    showInspector: function(){
      this.model.parentGraph.dataflow.showMenu("inspector");
      var $inspector = this.model.parentGraph.dataflow.$(".dataflow-plugin-inspector");
      $inspector.children().detach();
      $inspector.append( this.getInspect() );

      var $choose = this.$inspect.children(".dataflow-edge-inspector-route-choose");
      $choose.children().removeClass("active");
      $choose.children(".route"+this.model.get("route")).addClass("active");
    }
  });

}(Dataflow) );

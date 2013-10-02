( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  var template = 
    '<div class="dataflow-plugin-inspector-title">'+
      '<h1>Edge</h1>'+
      '<h2 class="dataflow-edge-inspector-id"><%= id %></h2>'+
    '</div>'+
    '<div class="dataflow-edge-inspector-route-choose"></div>'+
    '<ul class="dataflow-edge-inspector-events"></ul>';

  Edge.InspectView = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge-inspector",
    positions: null,
    template: _.template(template),
    initialize: function() {
      var templateData = this.model.toJSON();
      if (this.model.id) {
        templateData.id = this.model.id.replace('->', '&#8594;');
      }
      this.$el.html( this.template(templateData) );

      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");
      this.$log = this.$el.children('.dataflow-edge-inspector-events');

      var changeRoute = function(event){
        var route = $(event.target).data("route");
        this.model.set("route", route);
      }.bind(this);
      
      // Make buttons
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
      this.listenTo(this.model, "remove", this.remove);
      // Check if need to render logs
      this.animate();
    },
    render: function(){
      var route = this.model.get("route");
      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");
      $choose.children(".active").removeClass("active");
      $choose.children(".route"+route).addClass("active");
      return this;
    },
    showLogs: 20,
    lastLog: 0,
    animate: function (timestamp) {
      // Called from dataflow.shownCards collection (card-view.js)
      var logs = this.model.get('log');
      if (logs.length > this.lastLog) {
        this.renderLogs(logs);
        this.lastLog = logs.length;
      }
    },
    renderLogs: function (logs) {
      // Add new logs
      var firstToShow = this.lastLog;
      if (logs.length - this.lastLog > this.showLogs) {
        firstToShow = logs.length - this.showLogs;
      }
      for (var i=firstToShow; i<logs.length; i++){
        var item = logs.get(i);
        if (item) {
          var li = $("<li>")
            .addClass(item.type)
            .text( (item.group ? item.group + " " : "")+item.data);
          this.$log.append(li);
        }
      }
      // Trim list
      while (this.$log.children().length > this.showLogs) {
        this.$log.children().first().remove();
      }
      // Scroll list
      this.$log[0].scrollTop = this.$log[0].scrollHeight;
    }
  });

}(Dataflow) );

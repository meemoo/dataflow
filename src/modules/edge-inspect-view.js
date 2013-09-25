( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  var template = 
    '<div class="dataflow-plugin-inspector-title">'+
      '<h1>Edge</h1>'+
      '<h2 class="dataflow-edge-inspector-id"><%- id %></h2>'+
    '</div>'+
    '<div class="dataflow-edge-inspector-route-choose"></div>'+
    '<ul class="dataflow-edge-inspector-events"></ul>';

  var logTemplate = '<li class="<%- type %>"><%- group %><%- data %></li>';
  
  Edge.InspectView = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge-inspector",
    positions: null,
    template: _.template(template),
    showLogs: 20,
    initialize: function() {
      this.$el.html( this.template(this.model) );

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
      this.listenTo(this.model.get('log'), 'add', function () { 
        this.logDirty = true; 
      }.bind(this));
      this.renderLog();
    },
    render: function(){
      var route = this.model.get("route");
      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");
      $choose.children(".active").removeClass("active");
      $choose.children(".route"+route).addClass("active");
      return this;
    },
    logDirty: false,
    animate: function (timestamp) {
      // Called from dataflow.shownCards collection (card-view.js)
      if (this.logDirty) {
        this.logDirty = false;
        this.renderLog();
      }
    },
    renderLog: function () {
      var frag = document.createDocumentFragment();
      var logs = this.model.get('log');
      var logsToShow;
      if (logs.length > this.showLogs) {
        logsToShow = logs.rest(logs.length - this.showLogs);
      } else {
        logsToShow = logs.toArray();
      }
      //JANK warning, already taking 14ms with 20 log items
      _.each(logsToShow, function (item) {
        this.renderLogItem(item, frag);
      }, this);
      this.$log.html(frag);
      this.$log[0].scrollTop = this.$log[0].scrollHeight;
    },
    renderLogItem: function (item, fragment) {
      var html = $(_.template(logTemplate, item.toJSON()));
      if (fragment && fragment.appendChild) {
        fragment.appendChild(html[0]);
      } else {
        this.$log.append(html);
        this.$log[0].scrollTop = this.$log[0].scrollHeight;
      }
    }
  });

}(Dataflow) );

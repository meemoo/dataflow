( function(Dataflow) {
 
  var Log = Dataflow.prototype.plugin("log");

  Log.initialize = function(dataflow){

    var $log = $(
      '<div class="dataflow-plugin-log dataflow-plugin-overflow">'+
        '<ol class="loglist"></ol>'+
      '</div>'
    );

    dataflow.addPlugin({
      id: "log", 
      label: "log",
      name: "", 
      menu: $log, 
      icon: "th-list",
      pinned: true
    });

    // Log message and scroll
    function log(message){
      message = _.escape(message);
      $log.children(".loglist").append("<li>" + message + "</li>");
      $log.scrollTop( $log.prop("scrollHeight") );
    }

    Log.add = log;

    var logged = function(message){
      log("log: " + message);
    };
    var nodeAdded = function(graph, node){
      log("node added: " + node.toString());
    };
    var nodeRemoved = function(graph, node){
      log("node removed: " + node.toString());
    };
    var edgeAdded = function(graph, edge){
      log("edge added: " + edge.toString());
    };
    var edgeRemoved = function(graph, edge){
      log("edge removed: " + edge.toString());
    };



    Log.listeners = function(boo){
      if (boo) {
        // Log
        dataflow.on("log", logged);

        // Log graph changes
        dataflow.on("node:add", nodeAdded);
        dataflow.on("node:remove", nodeRemoved);
        dataflow.on("edge:add", edgeAdded);
        dataflow.on("edge:remove", edgeRemoved);
      } else {
        // Custom for other integration
        dataflow.off("log", logged);
        dataflow.off("node:add", nodeAdded);
        dataflow.off("node:remove", nodeRemoved);
        dataflow.off("edge:add", edgeAdded);
        dataflow.off("edge:remove", edgeRemoved);
      }
    };
    Log.listeners(true);

  };

}(Dataflow) );

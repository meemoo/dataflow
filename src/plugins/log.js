( function(Dataflow) {
 
  var Log = Dataflow.prototype.plugin("log");

  Log.initialize = function(dataflow){

    var $log = $(
      '<div class="dataflow-plugin-log" style="width:400px; height: 250px; overflow: auto;">'+
        '<ol class="loglist"></ol>'+
      '</div>'
    );

    dataflow.addPlugin("log", $log);

    // Log message and scroll
    function log(message){
      message = _.escape(message);
      $log.children(".loglist").append("<li>" + message + "</li>");
      $log.scrollTop( $log.prop("scrollHeight") );
    }

    // Log
    dataflow.on("log", function(message){
      log("log: " + message);
    });

    // Log graph changes
    dataflow.on("node:add", function(graph, node){
      log("node added: " + node.toString());
    });
    dataflow.on("node:remove", function(graph, node){
      log("node removed: " + node.toString());
    });
    dataflow.on("edge:add", function(graph, edge){
      log("edge added: " + edge.toString());
    });
    dataflow.on("edge:remove", function(graph, edge){
      log("edge removed: " + edge.toString());
    });

  };

}(Dataflow) );

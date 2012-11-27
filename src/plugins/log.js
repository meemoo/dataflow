( function(Dataflow) {
 
  var $log = $(
    '<div class="dataflow-plugin-log" style="width:400px; height: 250px; overflow: auto;">'+
      '<ol class="loglist"></ol>'+
    '</div>'
  );

  Dataflow.addPlugin("log", $log);

  // Log message and scroll
  function log(message){
    message = _.escape(message);
    $log.children(".loglist").append("<li>" + message + "</li>");
    $log.scrollTop( $log.prop("scrollHeight") );
  }

  // Log
  Dataflow.on("log", function(message){
    log("log: " + message);
  });

  // Log graph changes
  Dataflow.on("node:add", function(graph, node){
    log("node added: " + node.toString());
  });
  Dataflow.on("node:remove", function(graph, node){
    log("node removed: " + node.toString());
  });
  Dataflow.on("edge:add", function(graph, edge){
    log("edge added: " + edge.toString());
  });
  Dataflow.on("edge:remove", function(graph, edge){
    log("edge removed: " + edge.toString());
  });

}(Dataflow) );

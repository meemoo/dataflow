( function(Dataflow) {
 
  var Log = Dataflow.prototype.plugin("log");

  Log.initialize = function(dataflow){

    var $log = $(
      '<div class="dataflow-plugin-log" style="position: absolute; top:5px; left:5px; bottom:5px; right:5px; overflow:auto;">'+
        '<ol class="loglist"></ol>'+
      '</div>'
    );

    dataflow.addPlugin({
      id: "log", 
      name: "log", 
      menu: $log, 
      icon: "cog"
    });

    // Log message and scroll
    function log(message){
      message = _.escape(message);
      $log.children(".loglist").append("<li>" + message + "</li>");
      $log.scrollTop( $log.prop("scrollHeight") );
    }

    Log.add = log;



    Log.listeners = function(boo){
      if (boo) {
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
      } else {
        // Custom
        dataflow.off("log");
        dataflow.off("node:add");
        dataflow.off("node:remove");
        dataflow.off("edge:add");
        dataflow.off("edge:remove");
      }
    };
    Log.listeners(true);

  };

}(Dataflow) );

( function(Dataflow) {
 
  var template = 
    '<button id="dataflow-plugin-edit-selectall">Select All (A)</button><br />'+
    '<button id="dataflow-plugin-edit-cut">Cut (X)</button><br />'+
    '<button id="dataflow-plugin-edit-copy">Copy (C)</button><br />'+
    '<button id="dataflow-plugin-edit-paste">Paste (V)</button><br />';

  Dataflow.addPlugin("edit", template);

  // On change update code view
  Dataflow.on("change", function(graph){
    if (Dataflow.graph) {
      $("#code").val( JSON.stringify(Dataflow.graph.toJSON(), null, "  ") );
    }
  });

  //
  // A
  //

  function selectAll(){
    Dataflow.currentGraph.view.$(".node").addClass("selected");
  }
  $("#dataflow-plugin-edit-selectall").click(selectAll);

  //
  // X
  //

  function cut(){
    // Copy selected
    copy();
    // Remove selected
    var toRemove = [];
    Dataflow.currentGraph.nodes.each(function(node){
      if (node.view.$el.hasClass("selected")) {
        toRemove.push(node);
      }
    });
    _.each(toRemove, function(node){
      node.collection.remove(node);
    });
  }
  $("#dataflow-plugin-edit-cut").click(cut);

  //
  // C
  //

  var copied = {};
  function copy(){
    copied = {};
    // nodes
    copied.nodes = [];
    Dataflow.currentGraph.nodes.each(function(node){
      if (node.view.$el.hasClass("selected")) {
        copied.nodes.push( JSON.parse(JSON.stringify(node)) );
      }
    });
    // edges
    copied.edges = [];
    Dataflow.currentGraph.edges.each(function(edge){
      if (false) {
        copied.edges.push( JSON.parse(JSON.stringify(edge)) );
      }
    });
  }
  $("#dataflow-plugin-edit-copy").click(copy);

  //
  // V
  //

  function paste(){
    if (copied && copied.nodes.length > 0) {
      var newNodes = [];
      // Deselect all
      Dataflow.currentGraph.view.$(".node").removeClass("selected");
      for (var i=0; i<copied.nodes.length; i++) {
        var oldNode = copied.nodes[i];
        // Offset pasted
        oldNode.x += 50;
        oldNode.y += 50;
        oldNode.parentGraph = Dataflow.currentGraph;
        oldNode.oldId = oldNode.id;
        // Make unique id
        while (Dataflow.currentGraph.nodes.get(oldNode.id)){
          oldNode.id++;
        }
        var newNode = new Dataflow.nodes[oldNode.type].Model(oldNode);
        Dataflow.currentGraph.nodes.add(newNode);
        // newNode.copiedFrom = oldNode.id;
        // newNodes.push(newNode);
        // Select pasted
        if (newNode.view) {
          newNode.view.$el.addClass("selected");
        }
      }
      // // Add edges
      // for (var j=0; j<copied.edges.length; j++) {
      //   var oldEdge = copied.edges[j];
      //   var newEdge = {source:[],target:[]};
      //   for (var k=0; k<newNodes.length; k++) {
      //     var node = newNodes[k];
      //     if (oldEdge.source[0] === node.copiedFrom) {
      //       newEdge.source[0] = node.id;
      //     }
      //     if (oldEdge.target[0] === node.copiedFrom) {
      //       newEdge.target[0] = node.id;
      //     }
      //   }
      //   newEdge.source[1] = oldEdge.source[1];
      //   newEdge.target[1] = oldEdge.target[1];
      //   newEdge = new Iframework.Edge( newEdge );
      //   newEdge.graph = this.model;
      //   this.model.addEdge(newEdge);
      // }
    }
  }
  $("#dataflow-plugin-edit-paste").click(paste);


}(Dataflow) );

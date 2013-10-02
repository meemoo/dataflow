( function(Dataflow) {

  var Edit = Dataflow.prototype.plugin("edit");

  Edit.initialize = function(dataflow){

    var buttons = $(
      '<div class="dataflow-plugin-edit">'+
        '<button class="selectall">Select All (A)</button><br />'+
        '<button class="cut">Cut (X)</button><br />'+
        '<button class="copy">Copy (C)</button><br />'+
        '<button class="paste">Paste (V)</button><br />'+
      '</div>'
    );

    // dataflow.addPlugin({
    //   id: "edit", 
    //   name: "edit", 
    //   menu: buttons, 
    //   icon: "edit"
    // });
    
    //
    // A
    //

    function selectAll(){
      dataflow.currentGraph.nodes.invoke("set", {selected:true});
    }
    buttons.children(".selectall").click(selectAll);
    Edit.selectAll = selectAll;

    //
    // X
    //
    
    Edit.removeSelected = function () {
      var toRemove = dataflow.currentGraph.nodes.where({selected:true});      
      _.each(toRemove, function(node){
        node.remove();
      });
    };

    function cut(){
      // Copy selected
      copy();
      // Move back so paste in original place
      _.each(copied.nodes, function(node){
        node.x -= 50;
        node.y -= 50;
      });

      // Remove selected
      Edit.removeSelected();

      // Update context
      dataflow.currentGraph.trigger('selectionChanged');
    }
    buttons.children(".cut").click(cut);
    Edit.cut = cut;
    
    

    function removeEdge(){
      var selected = dataflow.currentGraph.edges.where({selected:true});
      selected.forEach(function(edge){
        edge.remove();
      });
      // Update context
      dataflow.currentGraph.trigger('selectionChanged');
    }
    Edit.removeEdge = removeEdge;

    //
    // C
    //

    var copied = {};
    function copy(){
      copied = {};
      // nodes
      copied.nodes = dataflow.currentGraph.nodes.where({selected:true});
      copied.nodes = JSON.parse(JSON.stringify(copied.nodes));
      // edges
      copied.edges = [];
      dataflow.currentGraph.edges.each(function(edge){
        // Only copy the edges between nodes being copied
        var connectedSource = _.any(copied.nodes, function(node){
          return (edge.source.parentNode.id === node.id);
        });
        var connectedTarget = _.any(copied.nodes, function(node){
          return (edge.target.parentNode.id === node.id);
        });
        if (connectedSource || connectedTarget){
          copied.edges.push( JSON.parse(JSON.stringify(edge)) );
        }
      });
    }
    buttons.children(".copy").click(copy);
    Edit.copy = copy;

    //
    // V
    //

    function paste(){
      if (copied && copied.nodes && copied.nodes.length > 0) {
        // Deselect all
        dataflow.currentGraph.nodes.invoke("set", {selected:false});
        // Add nodes
        _.each(copied.nodes, function(node){
          // Offset pasted
          node.x += 50;
          node.y += 50;
          node.parentGraph = dataflow.currentGraph;
          node.selected = true;
          var oldId = node.id;
          // Make unique id
          while (dataflow.currentGraph.nodes.get(node.id)){
            node.id++;
          }
          // Update copied edges with new node id
          if (oldId !== node.id) {
            _.each(copied.edges, function(edge){
              if (edge.source.node === oldId) {
                edge.source.node = node.id;
              }
              if (edge.target.node === oldId) {
                edge.target.node = node.id;
              }
            });
          }
          var newNode = new dataflow.nodes[node.type].Model(node);
          dataflow.currentGraph.nodes.add(newNode);
          // Select new node
          newNode.view.bringToTop();
          newNode.view.highlight();
        });
        // Add edges
        _.each(copied.edges, function(edge){
          // Clone edge object (otherwise weirdness on multiple pastes)
          edge = JSON.parse(JSON.stringify(edge));
          // Add it
          edge.parentGraph = dataflow.currentGraph;
          edge.id = edge.source.node+":"+edge.source.port+"::"+edge.target.node+":"+edge.target.port;
          var newEdge = new dataflow.modules.edge.Model(edge);
          dataflow.currentGraph.edges.add(newEdge);
        });
      }
      // Rerender edges
      _.defer(function(){
        dataflow.currentGraph.view.rerenderEdges();
      });
    }
    buttons.children(".paste").click(paste);
    Edit.paste = paste;






    // Add context actions for actionbar

    dataflow.addContext({
      id: "cut",
      icon: "cut",
      label: "cut",
      action: cut,
      contexts: ["node", "nodes"]
    });
    dataflow.addContext({
      id: "copy",
      icon: "copy",
      label: "copy",
      action: copy,
      contexts: ["node", "nodes"]
    });
    dataflow.addContext({
      id: "paste",
      icon: "paste",
      label: "paste",
      action: paste,
      contexts: ["node", "nodes"]
    });

    dataflow.addContext({
      id: "edgeRemove",
      icon: "remove",
      label: "remove edge",
      action: removeEdge,
      contexts: ["edge"]
    });

    dataflow.addContext({
      id: "edgeRemove",
      icon: "remove",
      label: "remove edges",
      action: removeEdge,
      contexts: ["edges"]
    });

    dataflow.plugin('search').addCommand({
      names: ['remove', 'r', 'remove node'],
      args: ['node'],
      preview: function (text, callback) {
        if (!dataflow.currentGraph) {
          return;
        }
        var results = [];
        dataflow.currentGraph.nodes.each(function (node) {
          if (node.get('label').toLowerCase().indexOf(text.toLowerCase()) === -1) {
            return;
          }
          results.push({
            icon: 'remove',
            label: node.get('label'),
            description: node.type,
            item: node
          });
        });
        callback(results);
      },
      execute: function (item) {
        if (!dataflow.currentGraph) {
          return;
        }
        item.remove();
      }
    });

    Edit.onSearch = function (text, callback) {
      if (!dataflow.currentGraph) {
        return;
      }
      var results = [];
      dataflow.currentGraph.nodes.each(function (node) {
        if (node.get('label').toLowerCase().indexOf(text.toLowerCase()) === -1) {
          return;
        }
        results.push({
          source: 'edit',
          icon: 'sign-blank',
          label: node.get('label'),
          description: node.type,
          action: function () {
            node.view.select();
          }
        });
      });
      callback(results);
    };

  };

}(Dataflow) );

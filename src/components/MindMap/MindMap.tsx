import Script from 'next/script';
import React, { useRef, useEffect, useState } from 'react';
import cx from 'classnames';

import CircularProgress from '@mui/material/CircularProgress';

// const scriptSrc = 'https://unpkg.com/jsmind@0.5/es6/jsmind.js';
const scriptSrc = 'https://unpkg.com/gojs@2.3.5/release/go.js';

const containerId = 'myDiagramDiv';

type MindMapProps = {
  // mind: any;
  model: any;
};

const MindMap: React.FC<MindMapProps> = (props) => {
  const { model } = props;

  const instance = useRef<any>(null);
  const diagram = useRef<any>(null);

  const ref = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const onScriptLoad = () => {
    setScriptLoaded(true);
  };

  const loadChildNodes = (e: any, obj: any) => {
    console.log(`e->`, e);
    console.log(`obj->`, obj);
  };

  function init() {
    const go = (window as any).go;
    // Since 2.2 you can also author concise templates with method chaining instead of GraphObject.make
    // For details, see https://gojs.net/latest/intro/buildingObjects.html
    instance.current = go.GraphObject.make;
    const $ = instance.current;

    const myDiagram = $(go.Diagram, containerId, {
      // when the user drags a node, also move/copy/delete the whole subtree starting with that node
      'commandHandler.copiesTree': false,
      'commandHandler.copiesParentKey': false,
      'commandHandler.deletesTree': false,
      'draggingTool.dragsTree': false,
      'undoManager.isEnabled': false,
    });

    diagram.current = myDiagram;

    // when the document is modified, add a "*" to the title and enable the "Save" button
    // myDiagram.addDiagramListener('Modified', (e: any) => {
    //   var button = document.getElementById('SaveButton');
    //   if (button) button.disabled = !myDiagram.isModified;
    //   var idx = document.title.indexOf('*');
    //   if (myDiagram.isModified) {
    //     if (idx < 0) document.title += '*';
    //   } else {
    //     if (idx >= 0) document.title = document.title.slice(0, idx);
    //   }
    // });

    // a node consists of some text with a line shape underneath
    myDiagram.nodeTemplate = $(
      go.Node,
      'Vertical',
      { selectionObjectName: 'TEXT' },
      $(
        go.TextBlock,
        {
          name: 'TEXT',
          minSize: new go.Size(30, 15),
          editable: true,
        },
        // remember not only the text string but the scale and the font in the node data
        new go.Binding('text', 'text').makeTwoWay(),
        new go.Binding('scale', 'scale').makeTwoWay(),
        new go.Binding('font', 'font').makeTwoWay()
      ),
      $(
        go.Shape,
        'LineH',
        {
          stretch: go.GraphObject.Horizontal,
          strokeWidth: 3,
          height: 3,
          // this line shape is the port -- what links connect with
          portId: '',
          fromSpot: go.Spot.LeftRightSides,
          toSpot: go.Spot.LeftRightSides,
        },
        new go.Binding('stroke', 'brush')
        // make sure links come in from the proper direction and go out appropriately
        // new go.Binding('fromSpot', 'dir', (d) => spotConverter(d, true)),
        // new go.Binding('toSpot', 'dir', (d) => spotConverter(d, false))
      ),
      // remember the locations of each node in the node data
      new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(
        go.Point.stringify
      )
      // make sure text "grows" in the desired direction
      // new go.Binding('locationSpot', 'dir', (d) => spotConverter(d, false))
    );

    // selected nodes show a button for adding children
    myDiagram.nodeTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      'Spot',
      $(
        go.Panel,
        'Auto',
        // this Adornment has a rectangular blue Shape around the selected node
        $(go.Shape, { fill: null, stroke: 'dodgerblue', strokeWidth: 3 }),
        $(go.Placeholder, { margin: new go.Margin(4, 4, 0, 4) })
      )
      // and this Adornment has a Button to the right of the selected node
      // $(
      //   'Button',
      //   {
      //     alignment: go.Spot.Right,
      //     alignmentFocus: go.Spot.Left,
      //     click: addNodeAndLink, // define click behavior for this Button in the Adornment
      //   },
      //   $(
      //     go.TextBlock,
      //     '+', // the Button content
      //     { font: 'bold 8pt sans-serif' }
      //   )
      // )
    );

    // the context menu allows users to change the font size and weight,
    // and to perform a limited tree layout starting at that node
    myDiagram.nodeTemplate.contextMenu = $(
      'ContextMenu',
      $('ContextMenuButton', $(go.TextBlock, 'Load Child nodes'), {
        click: loadChildNodes,
      })
      //   $('ContextMenuButton', $(go.TextBlock, 'Smaller'), {
      //     click: (e, obj) => changeTextSize(obj, 1 / 1.1),
      //   }),
      //   $('ContextMenuButton', $(go.TextBlock, 'Bold/Normal'), {
      //     click: (e, obj) => toggleTextWeight(obj),
      //   }),
      //   $('ContextMenuButton', $(go.TextBlock, 'Copy'), {
      //     click: (e, obj) => e.diagram.commandHandler.copySelection(),
      //   }),
      //   $('ContextMenuButton', $(go.TextBlock, 'Delete'), {
      //     click: (e, obj) => e.diagram.commandHandler.deleteSelection(),
      //   }),
      //   $('ContextMenuButton', $(go.TextBlock, 'Undo'), {
      //     click: (e, obj) => e.diagram.commandHandler.undo(),
      //   }),
      //   $('ContextMenuButton', $(go.TextBlock, 'Redo'), {
      //     click: (e, obj) => e.diagram.commandHandler.redo(),
      //   }),
      //   $('ContextMenuButton', $(go.TextBlock, 'Layout'), {
      //     click: (e, obj) => {
      //       var adorn = obj.part;
      //       adorn.diagram.startTransaction('Subtree Layout');
      //       layoutTree(adorn.adornedPart);
      //       adorn.diagram.commitTransaction('Subtree Layout');
      //     },
      //   })
    );

    // a link is just a Bezier-curved line of the same color as the node to which it is connected
    myDiagram.linkTemplate = $(
      go.Link,
      {
        curve: go.Link.Bezier,
        fromShortLength: -2,
        toShortLength: -2,
        selectable: false,
      },
      $(
        go.Shape,
        { strokeWidth: 3 },
        new go.Binding('stroke', 'toNode', (n: any) => {
          if (n.data.brush) return n.data.brush;
          return 'black';
        }).ofObject()
      )
    );

    // the Diagram's context menu just displays commands for general functionality
    // myDiagram.contextMenu = $(
    //   'ContextMenu',
    //   $(
    //     'ContextMenuButton',
    //     $(go.TextBlock, 'Paste'),
    //     {
    //       click: (e, obj) =>
    //         e.diagram.commandHandler.pasteSelection(
    //           e.diagram.toolManager.contextMenuTool.mouseDownPoint
    //         ),
    //     },
    //     new go.Binding(
    //       'visible',
    //       '',
    //       (o) =>
    //         o.diagram &&
    //         o.diagram.commandHandler.canPasteSelection(
    //           o.diagram.toolManager.contextMenuTool.mouseDownPoint
    //         )
    //     ).ofObject()
    //   ),
    //   $(
    //     'ContextMenuButton',
    //     $(go.TextBlock, 'Undo'),
    //     { click: (e, obj) => e.diagram.commandHandler.undo() },
    //     new go.Binding(
    //       'visible',
    //       '',
    //       (o) => o.diagram && o.diagram.commandHandler.canUndo()
    //     ).ofObject()
    //   ),
    //   $(
    //     'ContextMenuButton',
    //     $(go.TextBlock, 'Redo'),
    //     { click: (e, obj) => e.diagram.commandHandler.redo() },
    //     new go.Binding(
    //       'visible',
    //       '',
    //       (o) => o.diagram && o.diagram.commandHandler.canRedo()
    //     ).ofObject()
    //   ),
    //   $('ContextMenuButton', $(go.TextBlock, 'Save'), {
    //     click: (e, obj) => save(),
    //   }),
    //   $('ContextMenuButton', $(go.TextBlock, 'Load'), {
    //     click: (e, obj) => load(),
    //   })
    // );

    // myDiagram.addDiagramListener('SelectionMoved', (e) => {
    //   var rootX = myDiagram.findNodeForKey(0).location.x;
    //   myDiagram.selection.each((node) => {
    //     if (node.data.parent !== 0) return; // Only consider nodes connected to the root
    //     var nodeX = node.location.x;
    //     if (rootX < nodeX && node.data.dir !== 'right') {
    //       updateNodeDirection(node, 'right');
    //     } else if (rootX > nodeX && node.data.dir !== 'left') {
    //       updateNodeDirection(node, 'left');
    //     }
    //     layoutTree(node);
    //   });
    // });

    // read in the predefined graph using the JSON format data held in the "mySavedModel" textarea
    load();
    layoutAll();
  }

  function load() {
    diagram.current.model = (window as any).go.Model.fromJson(model);
  }

  function layoutAngle(parts: any, angle: any) {
    const go = (window as any).go;

    var layout = go.GraphObject.make(go.TreeLayout, {
      angle: angle,
      arrangement: go.TreeLayout.ArrangementFixedRoots,
      nodeSpacing: 5,
      layerSpacing: 20,
      setsPortSpot: false, // don't set port spots since we're managing them with our spotConverter function
      setsChildPortSpot: false,
    });
    layout.doLayout(parts);
  }

  function layoutAll() {
    const myDiagram = diagram.current;
    var root = myDiagram.findNodeForKey(0);
    if (root === null) return;
    myDiagram.startTransaction('Layout');
    // split the nodes and links into two collections
    const go = (window as any).go;

    var rightward = new go.Set(/*go.Part*/);
    var leftward = new go.Set(/*go.Part*/);
    root.findLinksConnected().each((link: any) => {
      var child = link.toNode;
      if (child.data.dir === 'left') {
        leftward.add(root); // the root node is in both collections
        leftward.add(link);
        leftward.addAll(child.findTreeParts());
      } else {
        rightward.add(root); // the root node is in both collections
        rightward.add(link);
        rightward.addAll(child.findTreeParts());
      }
    });
    // do one layout and then the other without moving the shared root node
    layoutAngle(rightward, 0);
    layoutAngle(leftward, 180);
    myDiagram.commitTransaction('Layout');
  }

  // const node = useRef(() => {

  // }, [ref.current]);

  // const [nodes, setNodes, onNodesChange] =
  //   useNodesState<MindMapNode>(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  // const onConnect = useCallback(
  //   (params: any) => setEdges((eds) => addEdge(params, eds)),
  //   []
  // );

  // we are using a bit of a shortcut here to adjust the edge type
  // this could also be done with a custom edge for example
  // const edgesWithUpdatedTypes = edges.map((edge) => {
  //   if (edge.sourceHandle) {
  //     const edgeType = nodes.find((node: any) => node.type === 'custom').data
  //       .selects[edge.sourceHandle];
  //     edge.type = edgeType;
  //   }

  //   return edge;
  // });

  // const path = (
  //   <path
  //     d={`
  //       M ${startPoint}
  //       Q ${controlPoint} ${endPoint}
  //     `}
  //     fill="none"
  //     stroke="hotpink"
  //     strokeWidth={2}
  //   />
  // );

  // const renderNodeChildren = (children?: MindMapNode<TObj>[]) => {
  //   if (!children || !children.length) return null;
  //   return <div className="flex gap-1">{children.map(renderNode)}</div>;
  // };

  // const renderNode = (node: MindMapNode<TObj>) => {
  //   return (
  //     <div key={node.id} className="m-2">
  //       <div>
  //         <div className="border border-gray py-2 px-3 rounded-full">
  //           {node.data.title}
  //         </div>
  //         <svg viewBox="0 0 200 350" style={{ maxHeight: 400 }}>
  //           {path}
  //         </svg>
  //       </div>
  //       {renderNodeChildren(node.children)}
  //     </div>
  //   );
  // };

  const renderMindMap = () => {
    console.log(`scriptLoaded->`, ref.current, scriptLoaded);
    return (
      <>
        <Script type="text/javascript" src={scriptSrc} onLoad={onScriptLoad} />
        <div ref={ref} id={containerId} style={{ height: 800 }} />
        {scriptLoaded ? null : <CircularProgress size={16} />}
      </>
    );
    // return (
    //   <Nodemap
    //     defaultValue={nodes}
    //     onDataChange={() => {}}
    //     // depthLimit={4}
    //     fields={['id', 'createdAt']} // output fields will be ['name', 'children','id','createdAt'], others will be omitted
    //   />
    // );
    // return <div className="flex flex-col">{nodes.map(renderNode)}</div>;

    // return (
    // <ReactFlow
    //   nodes={nodes}
    //   edges={edgesWithUpdatedTypes}
    //   onNodesChange={onNodesChange}
    //   onEdgesChange={onEdgesChange}
    //   onConnect={onConnect}
    //   fitView
    //   attributionPosition="top-right"
    //   nodeTypes={nodeTypes}
    // >
    //   <MiniMap style={minimapStyle} zoomable pannable />
    //   <Controls />
    //   <Background color="#aaa" gap={16} />
    // </ReactFlow>
    // );
  };

  useEffect(() => {
    if (!ref.current || !scriptLoaded) return;
    init();
  }, [ref.current, model, scriptLoaded]);
  return renderMindMap();
};

export default MindMap;

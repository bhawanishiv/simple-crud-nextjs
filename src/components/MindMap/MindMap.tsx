import Script from 'next/script';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import cx from 'classnames';

import CircularProgress from '@mui/material/CircularProgress';

type BaseNodeData = {
  title: string;
};

type MindMapNode<TObj extends BaseNodeData> = {
  id: string;
  name: string;
  // render: (data: TObj, id: string, parentId: string) => React.ReactNode;
  children?: MindMapNode<TObj>[];
};

// type MindMapNode = {
//   id: string;
//   position: {
//     x: number;
//     y: number;
//   };
//   type?: 'input' | 'output';
//   data: {
//     label: string;
//   };
// };

type MindMapEdge = {
  id: string;
  source: string;
  target: string;
};

type MindMapProps = {
  mind: any;
};

const minimapStyle = {
  height: 120,
};

// const nodes: MindMapNode<any>[] = [
//   {
//     id: 'root',
//     name: 'Root',

//     children: [
//       {
//         id: 'root-child',
//         name: 'Child 1',
//       },
//     ],
//   },
// ];
// your tree data
const root = {
  isRoot: true,
  id: 'Root',
  children: [
    {
      id: 'SubTreeNode1',
      children: [
        {
          id: 'SubTreeNode1.1',
        },
        {
          id: 'SubTreeNode1.2',
        },
      ],
    },
    {
      id: 'SubTreeNode2',
    },
  ],
};

// const mind = {
//   meta: {
//     name: '',
//     author: 'bhawanishiv@gmail.com',
//     version: '0.2',
//   },
//   format: 'node_tree',
//   data: {
//     id: 'root',
//     topic: 'jsMind',
//     children: [
//       {
//         id: 'easy',
//         topic: 'Easy',
//         direction: 'left',
//         children: [
//           { id: 'easy1', topic: 'Easy to show' },
//           { id: 'easy2', topic: 'Easy to edit' },
//           { id: 'easy3', topic: 'Easy to store' },
//           { id: 'easy4', topic: 'Easy to embed' },
//         ],
//       },
//       {
//         id: 'open',
//         topic: 'Open Source',
//         direction: 'right',
//         children: [
//           { id: 'open1', topic: 'on GitHub' },
//           { id: 'open2', topic: 'BSD License' },
//         ],
//       },
//       {
//         id: 'powerful',
//         topic: 'Powerful',
//         direction: 'right',
//         children: [
//           { id: 'powerful1', topic: 'Base on Javascript' },
//           { id: 'powerful2', topic: 'Base on HTML5' },
//           { id: 'powerful3', topic: 'Depends on you' },
//         ],
//       },
//       {
//         id: 'other',
//         topic: 'test node',
//         direction: 'left',
//         children: [
//           { id: 'other1', topic: "I'm from local variable" },
//           { id: 'other2', topic: 'I can do everything' },
//         ],
//       },
//     ],
//   },
// };

const MindMap: React.FC<MindMapProps> = (props) => {
  const { mind } = props;

  const ref = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const onScriptLoad = () => {
    setScriptLoaded(true);
  };
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
        <Script
          type="text/javascript"
          src="https://unpkg.com/jsmind@0.5/es6/jsmind.js"
          onLoad={onScriptLoad}
        />
        <div ref={ref} id="jsmind_container" style={{ height: 800 }} />
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

    const options = {
      container: 'jsmind_container',
      theme: 'orange',
      editable: false,
    };

    let jsMind = (window as any).jsMind as any;
    console.log(`jsMind->`, jsMind);
    if (jsMind) {
      const jm = new jsMind(options);
      console.log(`jm->`, jm);
      jm.show(mind);
    }
  }, [ref.current, mind, scriptLoaded]);
  return renderMindMap();
};

export default MindMap;

import {
  UIDLComponentType,
  UIDLDataSourceType,
  UIDLDocument,
  UIDLEventType,
  UIDLResourceStrategy,
  UIDLResourceType,
} from "../../src/types/uidl";

export const sampleUIDL: UIDLDocument = {
  version: "1.0",
  name: "Demo Page",
  importMaps: {
    react: "https://cdn.example.com/react.js",
  },
  nodeUIDL: {
    id: "page",
    type: UIDLComponentType.Page,
    children: [
      {
        id: "header",
        type: UIDLComponentType.Section,
        children: [
          {
            id: "title",
            type: UIDLComponentType.Text,
            textContent: { kind: "literal", value: "Welcome" },
          },
          {
            id: "action",
            type: UIDLComponentType.Button,
            events: [
              {
                type: UIDLEventType.Click,
                actions: [
                  {
                    name: "navigate",
                    args: { to: { kind: "literal", value: "/start" } },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "content",
        type: UIDLComponentType.Container,
        children: [
          {
            id: "input",
            type: UIDLComponentType.Input,
            props: {
              placeholder: { kind: "literal", value: "输入需求" },
            },
          },
          {
            id: "list",
            type: UIDLComponentType.List,
            bindings: {
              items: { kind: "binding", path: "todos" },
            },
            children: [
              {
                id: "item",
                type: UIDLComponentType.Text,
                textContent: { kind: "binding", path: "item.title" },
              },
            ],
          },
        ],
      },
    ],
  },
  resources: [
    {
      id: "styles",
      type: UIDLResourceType.Style,
      path: "/styles.css",
      strategy: UIDLResourceStrategy.Eager,
    },
  ],
  dataSources: [
    {
      id: "todos",
      type: UIDLDataSourceType.REST,
      url: "/api/todos",
      method: "GET",
    },
  ],
  observerDataSources: [
    {
      id: "ws",
      type: UIDLDataSourceType.Observer,
      url: "ws://localhost",
      triggers: [UIDLEventType.Load],
    },
  ],
  flows: [
    {
      id: "main-flow",
      name: "Main Flow",
      entryNodeId: "page",
    },
  ],
  containers: [
    {
      id: "sidebar",
      type: UIDLComponentType.Container,
      children: [
        { id: "logo", type: UIDLComponentType.Image, props: { src: { kind: "literal", value: "/logo.png" } } },
      ],
    },
  ],
};

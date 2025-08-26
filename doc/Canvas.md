## Canvas and Elements

#### Basic Structure of the Editor
```
└── Editor
    ├── Top Menu
    ├── Left Navigation Panel
    ├── Right Navigation Panel
    ├── Middle Top Insert/Toolbar
    ├── Bottom Input Panel
    └── Canvas
         ├── Viewport
         │    ├── Editable Elements
         │    └── Mouse Selection Box
         │
         └── Canvas Tools
              ├── Guidelines
              ├── Rulers
              ├── Element Operation Nodes (e.g., drag/resize handles)
              ├── Snap Alignment Lines
              └── Viewport Background
```

#### Basic Principles of the Canvas
Let's focus on the relatively complex [Canvas] section. Each element in the canvas is described by a set of data, for example:
```typescript
interface PPTBaseElement {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}
```
As the name suggests, `left` represents the element's position from the top-left corner of the canvas, `width` represents the element's width, and so on.
The key point to know is: the viewport defaults to a base ratio of 1000px width and 562.5px height. This means regardless of the actual size of the canvas and viewport, an element with `{ width: 1000px, height: 562.5px, left: 0, top: 0 }` will exactly fill the entire viewport.
The implementation method is simple: assuming the actual width of the viewport is 1200px, calculate the scaling ratio as 1200 / 1000 = 1.2, then scale all elements in the viewport by 1.2x.
Similarly, [Thumbnails] and [Presentation View] are essentially viewports with smaller or larger actual sizes.

#### Elements in the Canvas
In addition to the position and size information mentioned above, elements can carry more data. Taking a text element as an example:
```typescript
interface PPTTextElement {
  type: 'text';
  id: string;
  left: number;
  top: number;
  lock?: boolean;
  groupId?: string;
  width: number;
  height: number;
  link?: string;
  content: string;
  rotate: number;
  defaultFontName: string;
  defaultColor: string;
  outline?: PPTElementOutline;
  fill?: string;
  lineHeight?: number;
  wordSpace?: number;
  opacity?: number;
  shadow?: PPTElementShadow;
}
```
You can define a `rotate` to represent the text box's rotation angle, an `opacity` to represent the text box's transparency, etc. In implementation, you just need to render the element components according to the defined data, and editing elements essentially means modifying this data.
This is the basic composition of a canvas.

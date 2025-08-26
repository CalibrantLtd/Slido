# 🎨 Slido.ai
>  a web-based online presentation (slides) application that replicates most of the commonly used features of Office PowerPoint. It supports several most commonly used element types including text, images, shapes, lines, charts, tables, videos, audio, and formulas, allowing you to edit/present slides in a web browser.

# ✨ Project Features
1. Easy to develop: Built with Vue3.x + TypeScript, no dependency on UI component libraries, minimal use of third-party components, making style customization and feature extension easier.
2. Easy to use: Context menus available everywhere, dozens of shortcuts, countless editing details polished, striving to replicate desktop application-level experience.
3. Feature-rich: Supports most commonly used elements and features in PPT, AI-generated PPT, multiple export formats, basic mobile editing and preview...

# 👀 Important Notes
1. This project is a "Web Slideshow Application", not a "Low-code Platform", "H5 Editor", "Image Editor", "Whiteboard Application", etc.
2. The target audience of this project is <b>developers who have a need for [Web Slideshow] development</b>. The provided link is just a demo address and does not provide any online services. You should not use this project directly as a tool, nor is it supported out-of-the-box.
If you just need a service or tool, you can choose more excellent and mature products, such as: [Slidev](https://sli.dev/), [revealjs](https://revealjs.com/), etc.
3. This project is based on DOM rendering, with the advantage of being easy to get started and extend. However, compared to Canvas rendering solutions, there may be some performance gaps in complex scenarios, so if you have high performance requirements, this project may not be a good choice/reference direction.
4. Here are some [Frequently Asked Questions](/doc/Q&A.md). Please read this document before submitting Issues and PRs for the first time.

# 🚀 Running the Project
```
npm install

npm run dev
```

# 📚 Feature List
### Basic Features
- History (undo, redo)
- Shortcuts
- Context menu
- Export local files (PPTX, JSON, images, PDF)
- Import/export .slds files
- Print
- AI-generated PPT

### Slide Page Editing
- Page add, delete
- Page order adjustment
- Page copy/paste
- Slide sections
- Background settings (solid color, gradient, image)
- Set canvas size
- Gridlines
- Ruler
- Canvas zoom, move
- Theme settings
- Extract existing slide styles
- Speaker notes (rich text)
- Slide templates
- Page transition animations
- Element animations (entrance, exit, emphasis)
- Selection panel (hide elements, layer sorting, element naming)
- Page and node type annotations (can be used for template-related features)
- Find/replace
- Comments

### Slide Element Editing
- Element add, delete
- Element copy/paste
- Element drag to move
- Element rotation
- Element scaling
- Multi-select elements (box select, click select)
- Group multiple elements
- Batch edit multiple elements
- Lock elements
- Element snap alignment (move and scale)
- Element layer adjustment
- Align elements to canvas
- Align elements to other elements
- Evenly distribute multiple elements
- Drag to add text/images
- Paste external images
- Set element coordinates, size and rotation angle
- Element hyperlinks (link to web page, link to other slide pages)

#### Text
- Rich text editing (color, highlight, font, size, bold, italic, underline, strikethrough, superscript/subscript, inline code, quote, hyperlink, alignment, numbering, bullets, paragraph indentation, clear formatting)
- Line height
- Letter spacing
- Paragraph spacing
- First line indent
- Fill color
- Border
- Shadow
- Transparency
- Vertical text

#### Images
- Crop (custom, by shape, by aspect ratio)
- Rounded corners
- Filters
- Tint (mask)
- Flip
- Border
- Shadow
- Replace image
- Reset image
- Set as background image

#### Shapes
- Draw any polygon
- Draw any line (simulate unclosed shapes)
- Replace shape
- Fill color
- Border
- Shadow
- Transparency
- Flip
- Shape format painter
- Edit text (supports rich text, similar to text element rich text editing)

#### Lines
- Straight line, basic polyline/curve
- Color
- Width
- Style (solid, dashed, dotted)
- Endpoint style

#### Charts (bar, column, line, area, scatter, pie, donut, radar)
- Chart type conversion
- Data editing
- Background fill
- Theme color
- Axis text color
- Stacked mode, smooth curve, etc.

#### Tables
- Add/delete rows, columns
- Theme settings (theme color, header, total row, first column, last column)
- Merge cells
- Cell styles (fill color, text color, bold, italic, underline, strikethrough, alignment)
- Border

#### Video
- Preview cover settings
- Autoplay

#### Audio
- Icon color
- Autoplay
- Loop

#### Formulas
- LaTeX editing
- Color settings
- Formula line thickness settings

### Slide Show
- Preview all slides
- Pen, blackboard tools
- Timer tool
- Laser pointer
- Auto play
- Presenter view

### Mobile
- Basic editing
    - Page add, delete, copy, notes, undo/redo
    - Insert text, images, rectangles, circles
    - Element common operations: move, scale, rotate, copy, delete, layer adjustment, align
    - Element styles: text (bold, italic, underline, strikethrough, size, color, alignment), fill color
- Basic preview
- Play preview

# 🎯 Development
There is currently no complete development documentation, but these documents may be helpful:
- [Project Directory and Data Structure](/doc/DirectoryAndData.md)
- [Canvas and Element Basics](/doc/Canvas.md)
- [How to Customize an Element](/doc/CustomElement.md)


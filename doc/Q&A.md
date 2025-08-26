## FAQ
#### Q. Why doesn't the xxx shortcut work?

A. Some shortcuts only work when focused on specific areas. For example, page operation shortcuts only work when focused on the left thumbnail list, and element operation shortcuts only work when focused on the canvas area.

#### Q. Why isn't pasting working?

A. Please ensure the browser has permission to access the system clipboard.

#### Q. Why do my previous PPTs disappear after refreshing or reopening the browser?

A. The repository links are for demonstration only. This is a pure front-end project without a backend, so it doesn't save data.

#### Q. How do I adjust slide order?

A. Drag and drop the thumbnails on the left to rearrange them.

#### Q. Why does the app become unresponsive after inserting images?

A. Since this demo project doesn't use a backend, local images are stored as Base64, resulting in very large data sizes. In production, you should upload images and reference their URLs instead.

#### Q. Why doesn't applying a preset theme work?

A. Preset themes only affect newly added elements and pages. Use the "Apply Theme to All" feature to apply the current theme to all existing pages.

#### Q. Why doesn't setting an online font work?

A. Online fonts require downloading the font file, which can take time due to file size. The new font will apply after download completes.

#### Q. About importing/exporting PPTX files

A. As an online presentation app, PPTX import/export is important but more complex than expected. Due to time constraints, we rely on third-party solutions:

Export: Based on [PptxGenJS](https://github.com/gitbrent/PptxGenJS/), exports most basic elements but has limitations:
1. Depends on PptxGenJS capabilities (e.g. no animations)
2. Goal is to export elements with similar styles, not pixel-perfect recreations

Note: This isn't an Office PPT editor. Import/export is a feature, not the main purpose.

#### Q. What video formats are supported?

A. Basic video tag support. Can add [hls.js](https://github.com/video-dev/hls.js) or [flv.js](https://github.com/Bilibili/flv.js) for .m3u8/.flv support by including their files.

#### Q. About importing JSON files

A. Not recommended to expose JSON import to end users due to security. If needed, implement server-side with proper validation.

#### Q. Print/export PDF styles don't match

A. Adjust browser print dialog settings:
- Margins: Default
- Uncheck: Headers/footers
- Check: Background graphics
For production, use backend PDF generation (e.g. Puppeteer).

#### Q. Why doesn't mobile support xxx feature?

A. Mobile is intentionally limited for quick edits. Full editing should be done on desktop. Can use desktop mode on mobile or customize as needed.

#### Q. About compatibility?

A. Prioritizes Chrome/Firefox. Some Safari issues. No IE support.

#### Q. Why isn't this an NPM package?

A. Slido.ai is a complete app, not a library. Requires significant customization for real use:
- Backend integration
- Custom templates/materials
- New element types
- Theme customization
- Shortcut changes
- etc.

Better to clone and modify the full codebase. See similar approach in [drawio](https://github.com/jgraph/drawio).

#### Q. About AI PPT

A. Basic demo of AI PPT generation:
1. Template customization
2. AI data + template merging
3. Image replacement

Note: Image replacement requires your own image source (e.g. AI image generation, stock photos).


## Project Directory Structure and Data

### Project Directory Structure
```
├── assets                        // Static resources
│   ├── fonts                     // Web font files
│   └── styles                    // Styles
│       ├── antd.scss             // antd default style overrides
│       ├── font.scss             // Web font definitions
│       ├── global.scss           // Common global styles
│       ├── mixin.scss            // SCSS global mixins
│       ├── variable.scss         // SCSS global variables
│       └── prosemirror.scss      // ProseMirror rich text default styles
├── components                    // Generic components independent of business logic
├── configs                       // Configuration files, including: canvas size, fonts, animation settings, hotkey configurations, preset shapes, preset lines, etc.
├── hooks                         // Hooks methods used by multiple components/modules
├── mocks                         // Mock data
├── plugins                       // Custom Vue plugins
├── types                         // Type definition files
├── store                         // Pinia store, reference: https://pinia.vuejs.org/
├── utils                         // Common utility methods
└── views                         // Business components directory, divided into `Editor` and `Player` sections
    ├── components                // Shared business components
    ├── Editor                    // Editor module
    ├── Screen                    // Player module
    └── Mobile                    // Mobile module
```


### Data Structure
The presentation data mainly consists of two parts: `slides` and `theme`.
> In other words, in a production environment, you generally only need to store these two data items.

- `slides` represents slide page data, including each page's ID, element content, notes, background, animations, transition effects, etc.
- `theme` represents slide theme data, including background color, theme colors, font colors, fonts, etc.


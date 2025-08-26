export const enum ShapePathFormulasKeys {
  ROUND_RECT = 'roundRect',
  ROUND_RECT_DIAGONAL = 'roundRectDiagonal',
  ROUND_RECT_SINGLE = 'roundRectSingle',
  ROUND_RECT_SAMESIDE = 'roundRectSameSide',
  CUT_RECT_DIAGONAL = 'cutRectDiagonal',
  CUT_RECT_SINGLE = 'cutRectSingle',
  CUT_RECT_SAMESIDE = 'cutRectSameSide',
  CUT_ROUND_RECT = 'cutRoundRect',
  MESSAGE = 'message',
  ROUND_MESSAGE = 'roundMessage',
  L = 'L',
  RING_RECT = 'ringRect',
  PLUS = 'plus',
  TRIANGLE = 'triangle',
  PARALLELOGRAM_LEFT = 'parallelogramLeft',
  PARALLELOGRAM_RIGHT = 'parallelogramRight',
  TRAPEZOID = 'trapezoid',
  BULLET = 'bullet',
  INDICATOR = 'indicator',
}

export const enum ElementTypes {
  TEXT = 'text',
  IMAGE = 'image',
  SHAPE = 'shape',
  LINE = 'line',
  CHART = 'chart',
  TABLE = 'table',
  LATEX = 'latex',
  VIDEO = 'video',
  AUDIO = 'audio',
  DASHBOARD_TABLE = 'dashboard-table',
}

/**
 * Gradient configuration
 * 
 * type: Gradient type (radial or linear)
 * 
 * colors: List of gradient colors (pos: percentage position; color: color value)
 * 
 * rotate: Gradient rotation angle (for linear gradients)
 */
export type GradientType = 'linear' | 'radial'
export type GradientColor = {
  pos: number
  color: string
}
export interface Gradient {
  type: GradientType
  colors: GradientColor[]
  rotate: number
}

export type LineStyleType = 'solid' | 'dashed' | 'dotted'

/**
 * Element shadow properties
 * 
 * h: Horizontal offset in pixels
 * 
 * v: Vertical offset in pixels
 * 
 * blur: Blur radius in pixels
 * 
 * color: Shadow color in CSS format
 */
export interface PPTElementShadow {
  h: number
  v: number
  blur: number
  color: string
}

/**
 * Element border properties
 * 
 * style?: Border line style (solid, dashed, or dotted)
 * 
 * width?: Border width in pixels
 * 
 * color?: Border color in CSS format
 */
export interface PPTElementOutline {
  style?: LineStyleType
  width?: number
  color?: string
}

export type ElementLinkType = 'web' | 'slide'

/**
 * Element hyperlink configuration
 * 
 * type: Link type (web URL or slide page reference)
 * 
 * target: Target destination (URL string or slide ID)
 */
export interface PPTElementLink {
  type: ElementLinkType
  target: string
}


/**
 * Base properties shared by all elements
 * 
 * id: Unique element identifier
 * 
 * left: Horizontal position from left edge of canvas in pixels
 * 
 * top: Vertical position from top edge of canvas in pixels
 * 
 * lock?: Whether element is locked from editing
 * 
 * groupId?: Group identifier (elements sharing same group ID are grouped together)
 * 
 * width: Element width in pixels
 * 
 * height: Element height in pixels
 * 
 * rotate: Rotation angle in degrees
 * 
 * link?: Optional hyperlink configuration
 * 
 * name?: Optional element name
 */
interface PPTBaseElement {
  id: string
  left: number
  top: number
  lock?: boolean
  groupId?: string
  width: number
  height: number
  rotate: number
  link?: PPTElementLink
  name?: string
}


export type TextType = 'title' | 'subtitle' | 'content' | 'item' | 'itemTitle' | 'notes' | 'header' | 'footer' | 'partNumber' | 'itemNumber'

/**
 * Text element properties
 * 
 * type: Element type (always 'text')
 * 
 * content: Text content as HTML string
 * 
 * defaultFontName: Default font family (can be overridden by inline styles)
 * 
 * defaultColor: Default text color (can be overridden by inline styles)
 * 
 * outline?: Optional border configuration
 * 
 * fill?: Optional background fill color
 * 
 * lineHeight?: Line height multiplier (default: 1.5)
 * 
 * wordSpace?: Character spacing in pixels (default: 0)
 * 
 * opacity?: Element opacity (default: 1)
 * 
 * shadow?: Optional shadow configuration
 * 
 * paragraphSpace?: Spacing between paragraphs in pixels (default: 5)
 * 
 * vertical?: Whether text is displayed vertically
 * 
 * textType?: Text style type (title, subtitle, content, etc.)
 */
export interface PPTTextElement extends PPTBaseElement {
  type: 'text'
  content: string
  defaultFontName: string
  defaultColor: string
  outline?: PPTElementOutline
  fill?: string
  lineHeight?: number
  wordSpace?: number
  opacity?: number
  shadow?: PPTElementShadow
  paragraphSpace?: number
  vertical?: boolean
  textType?: TextType
}


/**
 * Image and shape flip properties
 * 
 * flipH?: Whether to flip horizontally
 * 
 * flipV?: Whether to flip vertically
 */
export interface ImageOrShapeFlip {
  flipH?: boolean
  flipV?: boolean
}

/**
 * Image filter properties
 * 
 * See CSS filter documentation: https://developer.mozilla.org/en-US/docs/Web/CSS/filter
 * 
 * 'blur'?: Blur radius in pixels (default: 0)
 * 
 * 'brightness'?: Brightness percentage (default: 100)
 * 
 * 'contrast'?: Contrast percentage (default: 100)
 * 
 * 'grayscale'?: Grayscale percentage (default: 0)
 * 
 * 'saturate'?: Saturation percentage (default: 100)
 * 
 * 'hue-rotate'?: Hue rotation in degrees (default: 0)
 * 
 * 'opacity'?: Opacity percentage (default: 100)
 */
export type ImageElementFilterKeys = 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'saturate' | 'hue-rotate' | 'opacity' | 'sepia' | 'invert'
export interface ImageElementFilters {
  'blur'?: string
  'brightness'?: string
  'contrast'?: string
  'grayscale'?: string
  'saturate'?: string
  'hue-rotate'?: string
  'sepia'?: string
  'invert'?: string
  'opacity'?: string
}

export type ImageClipDataRange = [[number, number], [number, number]]

/**
 * Image cropping configuration
 * 
 * range: Crop area as percentage coordinates [[startX, startY], [endX, endY]]
 * 
 * shape: Crop shape identifier (see CLIPPATHS in configs/imageClip.ts)
 */
export interface ImageElementClip {
  range: ImageClipDataRange
  shape: string
}

export type ImageType = 'pageFigure' | 'itemFigure' | 'background'

/**
 * Image element properties
 * 
 * type: Element type (always 'image')
 * 
 * fixedRatio: Whether to maintain aspect ratio when resizing
 * 
 * src: Image source URL
 * 
 * outline?: Optional border configuration
 * 
 * filters?: Optional image filters
 * 
 * clip?: Optional cropping configuration
 * 
 * flipH?: Whether to flip horizontally
 * 
 * flipV?: Whether to flip vertically
 * 
 * shadow?: Optional shadow configuration
 * 
 * radius?: Corner radius in pixels
 * 
 * colorMask?: Optional color overlay
 * 
 * imageType?: Image usage type (background, figure, etc.)
 */
export interface PPTImageElement extends PPTBaseElement {
  type: 'image'
  fixedRatio: boolean
  src: string
  outline?: PPTElementOutline
  filters?: ImageElementFilters
  clip?: ImageElementClip
  flipH?: boolean
  flipV?: boolean
  shadow?: PPTElementShadow
  radius?: number
  colorMask?: string
  imageType?: ImageType
}

export type ShapeTextAlign = 'top' | 'middle' | 'bottom' 

/**
 * Shape text properties
 * 
 * content: Text content as HTML string
 * 
 * defaultFontName: Default font family (can be overridden by inline styles)
 * 
 * defaultColor: Default text color (can be overridden by inline styles)
 * 
 * align: Vertical text alignment (top, middle, bottom)
 * 
 * type: Text style type (title, subtitle, content, etc.)
 */
export interface ShapeText {
  content: string
  defaultFontName: string
  defaultColor: string
  align: ShapeTextAlign
  type?: TextType
}

/**
 * Shape element properties
 * 
 * type: Element type (always 'shape')
 * 
 * viewBox: SVG viewBox dimensions [width, height]
 * 
 * path: SVG path data (d attribute)
 * 
 * fixedRatio: Whether to maintain aspect ratio when resizing
 * 
 * fill: Background fill color (used when gradient is not present)
 * 
 * gradient?: Optional gradient configuration (overrides fill when present)
 * 
 * outline?: Optional border configuration
 * 
 * opacity?: Element opacity
 * 
 * flipH?: Whether to flip horizontally
 * 
 * flipV?: Whether to flip vertically
 * 
 * shadow?: Optional shadow configuration
 * 
 * special?: Marks complex shapes that use advanced path commands (these will be rasterized when exported)
 * 
 * text?: Optional text configuration
 * 
 * pathFormula?: Formula for dynamic path calculation
 * Normally, shape scaling only adjusts width/height based on viewBox ratio.
 * For shapes requiring precise control, this formula recalculates viewBox and path during scaling.
 * 
 * keypoints?: Percentage positions of key shape points
 */
export interface PPTShapeElement extends PPTBaseElement {
  type: 'shape'
  viewBox: [number, number]
  path: string
  fixedRatio: boolean
  fill: string
  gradient?: Gradient
  outline?: PPTElementOutline
  opacity?: number
  flipH?: boolean
  flipV?: boolean
  shadow?: PPTElementShadow
  special?: boolean
  text?: ShapeText
  pathFormula?: ShapePathFormulasKeys
  keypoints?: number[]
}


export type LinePoint = '' | 'arrow' | 'dot' 

/**
 * Line element properties
 * 
 * type: Element type (always 'line')
 * 
 * start: Start point coordinates [x, y]
 * 
 * end: End point coordinates [x, y]
 * 
 * style: Line style (solid, dashed, or dotted)
 * 
 * color: Line color in CSS format
 * 
 * points: Endpoint styles [startStyle, endStyle] (none, arrow, or dot)
 * 
 * shadow?: Optional shadow configuration
 * 
 * broken?: Control point for polyline [x, y]
 * 
 * broken2?: Secondary control point for complex polylines [x, y]
 * 
 * curve?: Control point for quadratic curves [x, y]
 * 
 * cubic?: Control points for cubic curves [[x1, y1], [x2, y2]]
 */
export interface PPTLineElement extends Omit<PPTBaseElement, 'height' | 'rotate'> {
  type: 'line'
  start: [number, number]
  end: [number, number]
  style: LineStyleType
  color: string
  points: [LinePoint, LinePoint]
  shadow?: PPTElementShadow
  broken?: [number, number]
  broken2?: [number, number]
  curve?: [number, number]
  cubic?: [[number, number], [number, number]]
}


export type ChartType = 'bar' | 'column' | 'line' | 'pie' | 'ring' | 'area' | 'radar' | 'scatter'

export interface ChartOptions {
  lineSmooth?: boolean
  stack?: boolean
}

export interface ChartData {
  labels: string[]
  legends: string[]
  series: number[][]
}

/**
 * Chart element properties
 * 
 * type: Element type (always 'chart')
 * 
 * fill?: Optional background fill color
 * 
 * chartType: Base chart type (bar, line, or pie - other types derive from these)
 * 
 * data: Chart data structure
 * 
 * options: Additional chart options
 * 
 * outline?: Optional border configuration
 * 
 * themeColors: Color palette for chart elements
 * 
 * textColor?: Optional text color override
 */
export interface PPTChartElement extends PPTBaseElement {
  type: 'chart'
  fill?: string
  chartType: ChartType
  data: ChartData
  options?: ChartOptions
  outline?: PPTElementOutline
  themeColors: string[]
  textColor?: string
}


export type TextAlign = 'left' | 'center' | 'right' | 'justify'
/**
 * Table cell style properties
 * 
 * bold?: Whether text is bold
 * 
 * em?: Whether text is italic
 * 
 * underline?: Whether text is underlined
 * 
 * strikethrough?: Whether text has strikethrough
 * 
 * color?: Text color in CSS format
 * 
 * backcolor?: Background color in CSS format
 * 
 * fontsize?: Font size in CSS units
 * 
 * fontname?: Font family name
 * 
 * align?: Text alignment (left, center, right, justify)
 */
export interface TableCellStyle {
  bold?: boolean
  em?: boolean
  underline?: boolean
  strikethrough?: boolean
  color?: string
  backcolor?: string
  fontsize?: string
  fontname?: string
  align?: TextAlign
}


/**
 * Table cell properties
 * 
 * id: Unique cell identifier
 * 
 * colspan: Number of columns spanned
 * 
 * rowspan: Number of rows spanned
 * 
 * text: Cell content text
 * 
 * style?: Optional cell style configuration
 */
export interface TableCell {
  id: string
  colspan: number
  rowspan: number
  text: string
  style?: TableCellStyle
}

/**
 * Table theme configuration
 * 
 * color: Primary theme color
 * 
 * rowHeader: Whether first row is styled as header
 * 
 * rowFooter: Whether last row is styled as footer
 * 
 * colHeader: Whether first column is styled as header
 * 
 * colFooter: Whether last column is styled as footer
 */
export interface TableTheme {
  color: string
  rowHeader: boolean
  rowFooter: boolean
  colHeader: boolean
  colFooter: boolean
}

/**
 * Table element properties
 * 
 * type: Element type (always 'table')
 * 
 * outline: Border configuration
 * 
 * theme?: Optional table theme
 * 
 * colWidths: Array of column widths as percentages [width1, width2, ...]
 * 
 * cellMinHeight: Minimum cell height in pixels
 * 
 * data: 2D array of table cells
 */
export interface PPTTableElement extends PPTBaseElement {
  type: 'table'
  outline: PPTElementOutline
  theme?: TableTheme
  colWidths: number[]
  cellMinHeight: number
  data: TableCell[][]
}


/**
 * LaTeX formula element properties
 * 
 * type: Element type (always 'latex')
 * 
 * latex: LaTeX source code
 * 
 * path: SVG path data
 * 
 * color: Formula color
 * 
 * strokeWidth: Path stroke width
 * 
 * viewBox: SVG viewBox dimensions
 * 
 * fixedRatio: Whether to maintain aspect ratio
 */
export interface PPTLatexElement extends PPTBaseElement {
  type: 'latex'
  latex: string
  path: string
  color: string
  strokeWidth: number
  viewBox: [number, number]
  fixedRatio: boolean
}

/**
 * Video element properties
 * 
 * type: Element type (always 'video')
 * 
 * src: Video source URL
 * 
 * autoplay: Whether to autoplay video
 * 
 * poster?: Optional preview image URL
 * 
 * ext?: File extension (used when URL lacks explicit extension)
 */
export interface PPTVideoElement extends PPTBaseElement {
  type: 'video'
  src: string
  autoplay: boolean
  poster?: string
  ext?: string
}

/**
 * Audio element
 * 
 * type: Element type (audio)
 * 
 * fixedRatio: Fixed icon aspect ratio
 * 
 * color: Icon color
 * 
 * loop: Loop playback
 * 
 * autoplay: Autoplay
 * 
 * src: Audio URL
 * 
 * ext: Audio extension (used to determine resource type when URL lacks extension)
 */
export interface PPTAudioElement extends PPTBaseElement {
  type: 'audio'
  fixedRatio: boolean
  color: string
  loop: boolean
  autoplay: boolean
  src: string
  ext?: string
}

export interface PPTDashboardTableElement extends PPTBaseElement {
  type: 'dashboard-table'
  props?: {
    overflow?: string
  }
}

export type PPTElement = PPTTextElement | PPTImageElement | PPTShapeElement | PPTLineElement | PPTChartElement | PPTTableElement | PPTLatexElement | PPTVideoElement | PPTAudioElement | PPTDashboardTableElement

export type AnimationType = 'in' | 'out' | 'attention'
export type AnimationTrigger = 'click' | 'meantime' | 'auto'

/**
 * Element animation
 * 
 * id: Animation ID
 * 
 * elId: Element ID
 * 
 * effect: Animation effect
 * 
 * type: Animation type (enter, exit, emphasis)
 * 
 * duration: Animation duration
 * 
 * trigger: Animation trigger (click - on click, meantime - with previous animation, auto - after previous animation)
 */
export interface PPTAnimation {
  id: string
  elId: string
  effect: string
  type: AnimationType
  duration: number
  trigger: AnimationTrigger
}

export type SlideBackgroundType = 'solid' | 'image' | 'gradient'
export type SlideBackgroundImageSize = 'cover' | 'contain' | 'repeat'
export interface SlideBackgroundImage {
  src: string
  size: SlideBackgroundImageSize,
}

/**
 * Slide background
 * 
 * type: Background type (solid, image, gradient)
 * 
 * color?: Background color (solid)
 * 
 * image?: Image background
 * 
 * gradient?: Gradient background
 */
export interface SlideBackground {
  type: SlideBackgroundType
  color?: string
  image?: SlideBackgroundImage
  gradient?: Gradient
}


export type TurningMode = 'no' | 'fade' | 'slideX' | 'slideY' | 'random' | 'slideX3D' | 'slideY3D' | 'rotate' | 'scaleY' | 'scaleX' | 'scale' | 'scaleReverse'

export interface NoteReply {
  id: string
  content: string
  time: number
  user: string
}

export interface Note {
  id: string
  content: string
  time: number
  user: string
  elId?: string
  replies?: NoteReply[]
}

export interface SectionTag {
  id: string
  title?: string
}

export type SlideType = 'cover' | 'contents' | 'transition' | 'content' | 'end'

/**
 * Slide page
 * 
 * id: Page ID
 * 
 * elements: Element collection
 * 
 * notes?: Annotations
 * 
 * remark?: Remark
 * 
 * background?: Page background
 * 
 * animations?: Element animations
 * 
 * turningMode?: Page transition mode
 * 
 * slideType?: Page type
 */
export interface Slide {
  id: string
  elements: PPTElement[]
  notes?: Note[]
  remark?: string
  background?: SlideBackground
  animations?: PPTAnimation[]
  turningMode?: TurningMode
  sectionTag?: SectionTag
  type?: SlideType
}

/**
 * Slide theme
 * 
 * backgroundColor: Page background color
 * 
 * themeColor: Theme color (used for default shape colors, etc.)
 * 
 * fontColor: Font color
 * 
 * fontName: Font
 */
export interface SlideTheme {
  backgroundColor: string
  themeColor: string
  fontColor: string
  fontName: string
  outline: PPTElementOutline
  shadow: PPTElementShadow
}


const DEFAULT_CONFIG = {
  TOP: "top",
  width: 340,
  FONT_SIZE: "14",
  PADDING: "0 0 0 0",
  FONT_COL: "#454545",
  SHADOW_COL: "#ffffff",
  background: "#ffffff",
  font: "14px PingFang SC",
};

export const CACHE_INFO = {};

export const setInit = (config = {}) => {
  const info = { ...DEFAULT_CONFIG, ...config };
  CACHE_INFO.options = info;
  CACHE_INFO.ctx = wx.createCanvasContext(info.element, info.obj);
  return arg => Object.keys(arg).forEach(i => (CACHE_INFO.options[i] = arg[i]));
};

export const COMPUT_STYLE = [
  "width",
  "height",
  "font",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "textAlign",
  "color",
  "lineHeight",
  "border",
  "borderColor",
  "borderStyle",
  "borderWidth",
  "verticalAlign",
  "boxShadow",
  "background",
  "backgroundColor",
  "backgroundImage",
  "backgroundPosition",
  "backgroundSize",
  "paddingLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
];

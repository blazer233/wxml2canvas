import { drawRectToCanvas } from "./drawFun";

const DEFAULT_CONFIG = {
  width: 340,
  TOP: "top",
  FONT_SIZE: "14",
  PADDING: "0 0 0 0",
  FONT_COL: "#454545",
  SHADOW_COL: "#ffffff",
  background: "#ffffff",
  font: "14px PingFang SC",
  STROKECOLOR: "white",
};

export const CACHE_INFO = {};

export const setInit = (config = {}) => {
  const info = { ...DEFAULT_CONFIG, ...config };
  const { background, font, width, height, TOP, STROKECOLOR } = info;
  CACHE_INFO.options = info;
  CACHE_INFO.ctx = wx.createCanvasContext(info.element, info._this);
  CACHE_INFO.ctx.font = font;
  CACHE_INFO.ctx.setTextBaseline(TOP);
  CACHE_INFO.ctx.setStrokeStyle(STROKECOLOR); // 设置基本样式
  drawRectToCanvas(0, 0, width, height, { fill: background });
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
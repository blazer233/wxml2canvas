export const CACHE_INFO = {};
export const GET_INIT = (config = {}) => {
  const info = {
    ...config,
    width: config.width,
    height: config.height,
    translateX: config.translateX || 0,
    translateY: config.translateY || 0,
    background: config.background || "#ffffff",
    font: config.font || "14px PingFang SC",
    TOP: "top",
    SHADOW_COL: "#ffffff",
    PADDING: "0 0 0 0",
    FONT_SIZE: "14",
    FONT_COL: "#454545",
  };
  CACHE_INFO.options = info;
  CACHE_INFO.ctx = wx.createCanvasContext(info.element, info.obj);
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

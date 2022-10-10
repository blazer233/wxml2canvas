const device = wx.getSystemInfoSync() || {};
const destzoom = 3;

export const zoom = device.windowWidth / 375;
export const CACHE_INFO = {};
export const GET_INIT = (config = {}) => {
  const info = {
    zoom,
    ...config,
    width: config.width * zoom,
    height: config.height * zoom,
    destWidth: config.width * zoom * destzoom,
    destHeight: config.height * zoom * destzoom,
    translateX: (config.translateX || 0) * zoom,
    translateY: (config.translateY || 0) * zoom,
    background: config.background || "#ffffff",
    font: config.font || "14px PingFang SC",
    TOP: "top",
    SHADOW_COL: "#ffffff",
    PADDING: "0 0 0 0",
    FONT_SIZE: "14",
    FONT_COL: "#454545",
  };
  CACHE_INFO.options = info;
  CACHE_INFO.zoom = zoom;
  CACHE_INFO.ctx = wx.createCanvasContext(info.element, info.obj);
  return CACHE_INFO.ctx;
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

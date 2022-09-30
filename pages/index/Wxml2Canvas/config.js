let info;
const device = (wx.getSystemInfoSync && wx.getSystemInfoSync()) || {};
const destzoom = 3;
export const zoom = device.windowWidth / 375;
export const CONFIG_SET = (config = {}) => {
  if (info) return info;
  info = {
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
  };
  return info;
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

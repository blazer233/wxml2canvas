import { CACHE_INFO } from "./config";
import { transferBoxShadow, transferBorder } from "./utils";

export const drawBoxShadow = (boxShadow, cb) => {
  const { ctx } = CACHE_INFO;
  boxShadow = transferBoxShadow(boxShadow);
  if (boxShadow) {
    ctx.setShadow(
      boxShadow.offsetX,
      boxShadow.offsetY,
      boxShadow.blur,
      boxShadow.color
    );
  } else {
    ctx.setShadow(0, 0, 0, "#ffffff");
  }
  cb && cb(boxShadow || {});
};

export const setFill = (fill, cb) => {
  const { ctx } = CACHE_INFO;
  if (typeof fill === "string") {
    ctx.setFillStyle(fill);
  } else {
    let line = fill.line;
    let color = fill.color;
    let grd = ctx.createLinearGradient(line[0], line[1], line[2], line[3]);
    grd.addColorStop(0, color[0]);
    grd.addColorStop(1, color[1]);
    ctx.setFillStyle(grd);
  }
  cb && cb();
};

export const drawBorder = (border, style, cb) => {
  const { ctx, zoom } = CACHE_INFO;
  border = transferBorder(border);
  if (border && border.width) {
    // 空白阴影，清空掉边框的阴影
    drawBoxShadow();
    if (border) {
      ctx.setLineWidth(border.width * zoom);
      if (border.style === "dashed") {
        let dash = style.dash || [5, 5, 0];
        let offset = dash[2] || 0;
        let array = [dash[0] || 5, dash[1] || 5];
        ctx.setLineDash(array, offset);
      }
      ctx.setStrokeStyle(border.color);
    }
    cb && cb(border || {});
  }
};

export const cNum = number => {
  return isNaN(number) ? +(number || "").replace("px", "") : number;
};

/**
 * 内边距，依次为上右下左
 * @param {*} padding
 */
export const transferPadding = (padding = "0 0 0 0") => {
  padding = padding.split(" ");
  for (let i = 0, len = padding.length; i < len; i++) {
    padding[i] = +padding[i].replace("px", "");
  }
  return padding;
};

export const measureWidth = (text, font) => {
  const { ctx } = CACHE_INFO;
  if (font) {
    ctx.font = font;
  }
  let res = ctx.measureText(text) || {};
  return res.width || 0;
};

export const getLineHeight = style => {
  const { zoom } = CACHE_INFO.options;
  let lineHeight;
  if (!isNaN(style.lineHeight) && style.lineHeight > style.fontSize) {
    lineHeight = style.lineHeight;
  } else {
    style.lineHeight = (style.lineHeight || "") + "";
    lineHeight = +style.lineHeight.replace("px", "");
    lineHeight = lineHeight ? lineHeight : (style.fontSize || 14) * 1.2;
  }
  return lineHeight * zoom;
};
/**
 * 支持负值绘制，从右边计算
 * @param {*} item
 * @param {*} style
 */
export const resetPositionX = (item, style) => {
  const { width, translateX, zoom } = CACHE_INFO.options;
  let x = 0;
  // 通过wxml获取的不需要重置坐标
  if (item.x < 0 && item.type) {
    x = width + item.x * zoom - style.width * zoom;
  } else {
    x = item.x * zoom;
  }

  if (parseInt(style.borderWidth)) {
    x += parseInt(style.borderWidth);
  }

  return x + translateX;
};

/**
 * 支持负值绘制，从底部计算
 * @param {*} item
 * @param {*} style
 */
export const resetPositionY = (item, style, textHeight) => {
  const { height, translateY, zoom } = CACHE_INFO.options;
  let y = 0;
  if (item.y < 0) {
    y =
      height + item.y * zoom - (textHeight ? textHeight : style.height * zoom);
  } else {
    y = item.y * zoom;
  }
  if (parseInt(style.borderWidth)) {
    y += parseInt(style.borderWidth);
  }

  return y + translateY;
};

/**
 * 文字的padding、text-align
 * @param {*} item
 * @param {*} style
 * @param {*} textWidth
 */
export const resetTextPositionX = (item, style, textWidth, width) => {
  const { translateX } = CACHE_INFO.options;
  let textAlign = style.textAlign || "left";
  let x = item.x;
  if (textAlign === "center") {
    x = (width - textWidth) / 2 + item.x;
  } else if (textAlign === "right") {
    x = width - textWidth + item.x;
  }
  let left = style.padding ? style.padding[3] || 0 : 0;
  return x + left + translateX;
};

/**
 * 文字的padding、text-align
 * @param {*} item
 * @param {*} style
 * @param {*} textWidth
 */
export const resetTextPositionY = (item, style, lineNum = 0) => {
  const { zoom, translateY } = CACHE_INFO.options;
  let lineHeight = getLineHeight(style);
  let fontSize = Math.ceil((style.fontSize || 14) * zoom);

  let blockLineHeightFix =
    ((style.dataset && style.dataset.type) || "").indexOf("inline") > -1
      ? 0
      : (lineHeight - fontSize) / 2;
  let top = style.padding ? style.padding[0] || 0 : 0;
  // y + lineheight偏移 + 行数 + paddingTop + 整体画布位移
  return item.y + blockLineHeightFix + lineNum * lineHeight + top + translateY;
};

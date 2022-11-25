import { CACHE_INFO } from "./config";
import { calTxt, tNum, getLineHeight } from "./utils";

export const measureWidth = (text, font) => {
  const { ctx } = CACHE_INFO;
  if (font) {
    ctx.font = font;
  }
  let res = ctx.measureText(text) || {};
  return Math.floor(res.width || 0);
};

/**
 * 支持负值绘制，从右边计算
 * @param {*} item
 * @param {*} style
 */
export const resetPositionX = (item, style) => {
  const { width, translateX } = CACHE_INFO.options;
  let x = 0;
  // 通过wxml获取的不需要重置坐标
  if (item.x < 0 && item.type) {
    x = width + item.x - style.width;
  } else {
    x = item.x;
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
  const { height, translateY } = CACHE_INFO.options;
  let y = 0;
  if (item.y < 0) {
    y = height + item.y - (textHeight ? textHeight : style.height);
  } else {
    y = item.y;
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
  const { translateY } = CACHE_INFO.options;
  let lineHeight = getLineHeight(style);
  let fontSize = Math.ceil(style.fontSize || 14);

  let blockLineHeightFix =
    ((style.dataset && style.dataset.type) || "").indexOf("inline") > -1
      ? 0
      : (lineHeight - fontSize) / 2;
  let top = style.padding ? style.padding[0] || 0 : 0;
  // y + lineheight偏移 + 行数 + paddingTop + 整体画布位移
  return item.y + blockLineHeightFix + lineNum * lineHeight + top + translateY;
};

/**
 * 通过样式绘制文字
 * @param {*} style
 */
export const drawText = style => {
  const { ctx, options } = CACHE_INFO;
  style.fontSize = tNum(style.fontSize);
  const fontSize = Math.ceil(style.fontSize || options.FONT_SIZE);
  ctx.setTextBaseline("top");
  ctx.font = calTxt(style, fontSize);
  ctx.setFillStyle(style.color || options.FONT_COL);
};

export const drawRectToCanvas = (x, y, width, height, style) => {
  let { fill } = style;
  const { ctx, options } = CACHE_INFO;
  ctx.save();
  ctx.setShadow(0, 0, 0, options.SHADOW_COL);
  ctx.setFillStyle(fill);
  console.log(x, y);
  ctx.fillRect(x, y, width, height);
  ctx.draw(true);
  ctx.restore();
};

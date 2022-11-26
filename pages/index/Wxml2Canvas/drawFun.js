import { CACHE_INFO } from "./config";
import { calTxt, tNum, getLineHeight } from "./utils";

export const measureWidth = (text, font) => {
  const { ctx } = CACHE_INFO;
  if (font) {
    ctx.font = font;
  }
  const res = ctx.measureText(text) || {};
  return Math.floor(res.width || 0);
};

/**
 * 文字的padding、text-align
 * @param {*} item
 * @param {*} style
 * @param {*} textWidth
 */
export const setTxtAlignX = (item, style, textWidth, width) => {
  const textAlign = style.textAlign || "left";
  let x = item.x;
  if (textAlign === "center") x = (width - textWidth) / 2 + item.x;
  if (textAlign === "right") x = width - textWidth + item.x;
  const left = style.padding ? style.padding[3] || 0 : 0;
  return x + left;
};

/**
 * 文字的padding、text-align
 * @param {*} item
 * @param {*} style
 * @param {*} textWidth
 */
export const setTxtAlignY = (item, style, lineNum = 0) => {
  const { options } = CACHE_INFO;
  const lineHeight = getLineHeight(style);
  const fontSize = Math.ceil(style.fontSize || options.FONT_SIZE);
  const blockLineHeightFix =
    ((style.dataset && style.dataset.type) || "").indexOf("inline") > -1
      ? 0
      : (lineHeight - fontSize) / 2;
  const top = style.padding ? style.padding[0] || 0 : 0;
  // y + lineheight偏移 + 行数 + paddingTop
  return item.y + blockLineHeightFix + lineNum * lineHeight + top;
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
  const { fill } = style;
  const { ctx, options } = CACHE_INFO;
  ctx.save();
  ctx.setShadow(0, 0, 0, options.SHADOW_COL);
  ctx.setFillStyle(fill);
  ctx.fillRect(x, y, width, height);
  ctx.draw(true);
  ctx.restore();
};

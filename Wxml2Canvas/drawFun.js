import { CACHE_INFO } from "./config";
import { calTxt, transferNum, getLineHeight } from "./utils";

export const measureWidth = (text, font) => {
  const { ctx } = CACHE_INFO;
  if (font) {
    ctx.font = font;
  }
  const res = ctx.measureText(text) || {};
  return Math.floor(res.width || 0);
};

/**
 * 文字的padding、text-align X Y
 * @param {*} textData
 * @param {*} el
 * @param {*} textWidth
 */
export const setTxtAlign = (textData, el, textWidth, maxWidth, line = 0) => {
  const { options } = CACHE_INFO;
  const lineHeight = getLineHeight(el);
  const fontSize = Math.ceil(el.fontSize || options.FONT_SIZE);

  const blockLineHeightFix =
    el.dataset && el.dataset.type.indexOf("inline") > -1
      ? 0
      : (lineHeight - fontSize) / 2;
  const top = el.padding ? el.padding[0] || 0 : 0;
  const textAlign = el.textAlign || "left";
  let x = textData.x;
  if (textAlign === "center") x = (maxWidth - textWidth) / 2 + textData.x;
  if (textAlign === "right") x = maxWidth - textWidth + textData.x;
  const left = el.padding ? el.padding[3] || 0 : 0;

  // x：x + 左边距
  // y：y + lineheight偏移 + 行数 + paddingTop
  return [x + left, textData.y + blockLineHeightFix + line * lineHeight + top];
};

export const drawRectToCanvas = (x, y, width, height, el) => {
  const { fill } = el;
  const { ctx, options } = CACHE_INFO;
  ctx.save();
  ctx.setShadow(0, 0, 0, options.SHADOW_COL);
  ctx.setFillStyle(fill);
  ctx.fillRect(x, y, width, height);
  ctx.draw(true);
  ctx.restore();
};

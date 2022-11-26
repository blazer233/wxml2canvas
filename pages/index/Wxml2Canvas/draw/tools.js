import { drawRectToCanvas, measureWidth } from "../drawFun";

/**
 *
 * @param { object } item
 * @param { object } style
 * @param { number } textWidth
 * @param { number } textHeight
 * @returns
 */
export const drawTextBackgroud = (item, style, textWidth, textHeight) => {
  if (!style.width) return;
  let width = style.width || textWidth;
  let height = style.height || textHeight;
  const rectStyle = { fill: style.background, border: style.border };
  width += (style.padding[1] || 0) + (style.padding[3] || 0);
  height += (style.padding[0] || 0) + (style.padding[2] || 0);
  drawRectToCanvas(item.x, item.y, width, height, rectStyle);
};

/**
 * 当文本超过宽度时，计算每一行应该绘制的文本
 * @param {*} text
 * @param {*} width
 * @param {*} singleLength
 * @param {*} currentIndex
 * @param {*} widthOffset
 */
export const getTextSingleLine = (
  text,
  width,
  singleLength,
  currentIndex = 0,
  widthOffset = 0
) => {
  let offset = 0;
  let endIndex = currentIndex + singleLength + offset;
  let single = text.substring(currentIndex, endIndex);
  let singleWidth = measureWidth(single);

  while (Math.round(widthOffset + singleWidth) > width) {
    offset -= 1;
    endIndex = currentIndex + singleLength + offset;
    single = text.substring(currentIndex, endIndex);
    singleWidth = measureWidth(single);
  }

  return {
    endIndex,
    single,
    singleWidth,
  };
};

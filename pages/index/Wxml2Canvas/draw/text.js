import { CACHE_INFO } from "../config";
import { getLineHeight } from "../utils";
import { drawTextBackgroud, getTextSingleLine } from "./tools";
import { measureWidth, setTxtAlignX, setTxtAlignY, drawText } from "../drawFun";

/**
 * 绘制文字
 * @param { object } textData
 * @param { object } el
 * @param { function } resolve
 * @param { function } reject
 * @param { string } type
 * @returns
 */
const DrawTxt = (textData, el, resolve, reject, type = "text") => {
  const { ctx } = CACHE_INFO;
  let leftOffset = 0;
  let topOffset = 0;
  try {
    drawText(el);
    let text = textData.text || "";
    let textWidth = measureWidth(text, el.font || ctx.font);
    const lineHeight = getLineHeight(el);
    const textHeight =
      Math.ceil(textWidth / (el.width || textWidth)) * lineHeight;
    let width = Math.ceil(el.width || textWidth);
    let x = 0;
    let y = 0;
    if (el.background || el.border) {
      drawTextBackgroud(textData, el, textWidth, textHeight);
    }
    // 行内文本
    if (type === "inline-text") {
      const maxw = textData.maxWidth;
      // 如果上一个行内元素换行了，这个元素要继续在后面补足一行
      if (textData.leftOffset + textWidth > maxw) {
        let lineNum = Math.max(Math.floor(textWidth / maxw), 1);
        const length = text.length;
        const singleLength = Math.floor(length / lineNum);
        const widthOffset = textData.leftOffset
          ? textData.leftOffset - textData.originX
          : 0;
        let {
          endIndex: currentIndex,
          single,
          singleWidth,
        } = getTextSingleLine(text, maxw, singleLength, 0, widthOffset);
        x = setTxtAlignX(textData, el, singleWidth);
        y = setTxtAlignY(textData, el);
        ctx.fillText(single, x, y);
        leftOffset = x + singleWidth;
        topOffset = y;

        // 去除第一行补的内容，然后重置
        text = text.substring(currentIndex, text.length);
        currentIndex = 0;
        lineNum = Math.max(Math.floor(textWidth / maxw), 1);
        textWidth = measureWidth(text, el.font || ctx.font);
        textData.x = textData.originX; // 还原换行后的x
        for (let i = 0; i < lineNum; i++) {
          const { endIndex, single, singleWidth } = getTextSingleLine(
            text,
            width,
            singleLength,
            currentIndex
          );
          currentIndex = endIndex;
          if (single) {
            x = setTxtAlignX(textData, el, singleWidth, width);
            y = setTxtAlignY(textData, el, i + 1);
            ctx.fillText(single, x, y);
            if (i === lineNum - 1) {
              leftOffset = x + singleWidth;
              topOffset = lineHeight * lineNum;
            }
          }
        }
      } else {
        x = setTxtAlignX(textData, el, textWidth, width);
        y = setTxtAlignY(textData, el);
        ctx.fillText(textData.text, x, y);
        leftOffset = x + textWidth;
        topOffset = lineHeight;
      }
    } else {
      x = setTxtAlignX(textData, el, textWidth, width);
      y = setTxtAlignY(textData, el);
      ctx.fillText(textData.text, x, y);
    }
    ctx.draw(true);
    if (resolve) {
      resolve();
    } else {
      return {
        leftOffset,
        topOffset,
      };
    }
  } catch (e) {
    reject && reject({ errcode: 1004, errmsg: "drawText error", e });
  }
};
export default DrawTxt;

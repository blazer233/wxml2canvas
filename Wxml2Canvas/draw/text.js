import { CACHE_INFO } from "../config";
import { getLineHeight } from "../utils";
import { drawTextBackgroud, getTextSingleLine } from "./tools";
import { measureWidth, drawText, setTxtAlign } from "../drawFun";

/**
 * 绘制文字
 * @param { object } textData
 * @param { object } el
 * @param { function } resolve
 * @param { function } reject
 * @param { string } type
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
        const widthOffset = textData.leftOffset - textData.originX;
        let [endIdx, fSingle, fsWidth] = getTextSingleLine(
          text,
          maxw,
          singleLength,
          0,
          widthOffset
        );
        [x, y] = setTxtAlign(textData, el, fsWidth);
        ctx.fillText(fSingle, x, y);
        leftOffset = x + fsWidth;
        topOffset = y;

        // 去除第一行补的内容，然后重置
        text = text.substring(endIdx, text.length);
        endIdx = 0;
        lineNum = Math.max(Math.floor(textWidth / maxw), 1);
        textWidth = measureWidth(text, el.font || ctx.font);
        textData.x = textData.originX; // 还原换行后的x
        for (let i = 0; i < lineNum; i++) {
          const [endIndex, single, sWidth] = getTextSingleLine(
            text,
            maxw,
            singleLength,
            endIdx
          );
          endIdx = endIndex;
          if (single) {
            [x, y] = setTxtAlign(textData, el, sWidth, maxw, i + 1);
            ctx.fillText(single, x, y);
            if (i === lineNum - 1) {
              leftOffset = x + sWidth;
              topOffset = lineHeight * lineNum;
            }
          }
        }
        let last = text.substring(endIdx, length);
        let lastWidth = measureWidth(last);
        if (last) {
          [x, y] = setTxtAlign(textData, el, textWidth, maxw, lineNum + 1);
          ctx.fillText(last, x, y);
          leftOffset = x + lastWidth;
          topOffset = lineHeight * (lineNum + 1);
        }
      } else {
        [x, y] = setTxtAlign(textData, el, textWidth, maxw);
        ctx.fillText(textData.text, x, y);
        leftOffset = x + textWidth;
        topOffset = lineHeight;
      }
    } else {
      [x, y] = setTxtAlign(textData, el, textWidth, width);
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

import {
  measureWidth,
  resetPositionX,
  resetPositionY,
  resetTextPositionX,
  resetTextPositionY,
  drawText,
} from "../drawFun";
import { CACHE_INFO } from "../config";
import { transferPadding, getLineHeight } from "../utils";
import { drawTextBackgroud, getTextSingleLine } from "../core";

export default (textData, el, resolve, reject, type = "text") => {
  const { ctx } = CACHE_INFO;
  let leftOffset = 0;
  let topOffset = 0;
  try {
    drawText(el);
    let text = textData.text || "";
    let textWidth = measureWidth(text, el.font || ctx.font);
    let lineHeight = getLineHeight(el);
    let textHeight =
      Math.ceil(textWidth / (el.width || textWidth)) * lineHeight;
    let width = Math.ceil(el.width || textWidth);
    let x = 0;
    let y = 0;
    if (typeof el.padding === "string") {
      el.padding = transferPadding(el.padding);
    }
    textData.x = resetPositionX(textData, el);
    textData.y = resetPositionY(textData, el, textHeight);
    ctx.setShadow(0, 0, 0, "#ffffff");
    if (el.background || el.border) {
      drawTextBackgroud(textData, el, textWidth, textHeight);
    }

    // 行内文本
    if (type === "inline-text") {
      width = textData.maxWidth;
      if (textData.leftOffset + textWidth > width) {
        // 如果上一个行内元素换行了，这个元素要继续在后面补足一行
        let lineNum = Math.max(Math.floor(textWidth / width), 1);
        let length = text.length;
        let singleLength = Math.floor(length / lineNum);
        let widthOffset = textData.leftOffset
          ? textData.leftOffset - textData.originX
          : 0;
        let {
          endIndex: currentIndex,
          single,
          singleWidth,
        } = getTextSingleLine(text, width, singleLength, 0, widthOffset);
        x = resetTextPositionX(textData, el, singleWidth);
        y = resetTextPositionY(textData, el);
        ctx.fillText(single, x, y);
        leftOffset = x + singleWidth;
        topOffset = y;

        // 去除第一行补的内容，然后重置
        text = text.substring(currentIndex, text.length);
        currentIndex = 0;
        lineNum = Math.max(Math.floor(textWidth / width), 1);
        textWidth = measureWidth(text, el.font || ctx.font);
        textData.x = textData.originX; // 还原换行后的x
        for (let i = 0; i < lineNum; i++) {
          let { endIndex, single, singleWidth } = getTextSingleLine(
            text,
            width,
            singleLength,
            currentIndex
          );
          currentIndex = endIndex;
          if (single) {
            x = resetTextPositionX(textData, el, singleWidth, width);
            y = resetTextPositionY(textData, el, i + 1);
            ctx.fillText(single, x, y);
            if (i === lineNum - 1) {
              leftOffset = x + singleWidth;
              topOffset = lineHeight * lineNum;
            }
          }
        }
        let last = text.substring(currentIndex, length);
        let lastWidth = measureWidth(last);
        if (last) {
          x = resetTextPositionX(textData, el, lastWidth, width);
          y = resetTextPositionY(textData, el, lineNum + 1);
          ctx.fillText(last, x, y);
          leftOffset = x + lastWidth;
          topOffset = lineHeight * (lineNum + 1);
        }
      } else {
        x = resetTextPositionX(textData, el, textWidth, width);
        y = resetTextPositionY(textData, el);
        ctx.fillText(textData.text, x, y);
        leftOffset = x + textWidth;
        topOffset = lineHeight;
      }
    } else {
      x = resetTextPositionX(textData, el, textWidth, width);
      y = resetTextPositionY(textData, el);
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

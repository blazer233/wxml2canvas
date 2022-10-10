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

export default (item, style, resolve, reject, type = "text") => {
  const { ctx } = CACHE_INFO;
  let leftOffset = 0;
  let topOffset = 0;
  try {
    drawText(style);
    let text = item.text || "";
    let textWidth = measureWidth(text, style.font || ctx.font);
    let lineHeight = getLineHeight(style);
    let textHeight =
      Math.ceil(textWidth / (style.width || textWidth)) * lineHeight;
    let width = Math.ceil(style.width || textWidth);
    let x = 0;
    let y = 0;
    if (typeof style.padding === "string") {
      style.padding = transferPadding(style.padding);
    }
    item.x = resetPositionX(item, style);
    item.y = resetPositionY(item, style, textHeight);
    ctx.setShadow(0, 0, 0, "#ffffff");
    if (style.background || style.border) {
      drawTextBackgroud(item, style, textWidth, textHeight);
    }

    // 行内文本
    if (type === "inline-text") {
      width = item.maxWidth;
      if (item.leftOffset + textWidth > width) {
        // 如果上一个行内元素换行了，这个元素要继续在后面补足一行
        let lineNum = Math.max(Math.floor(textWidth / width), 1);
        let length = text.length;
        let singleLength = Math.floor(length / lineNum);
        let widthOffset = item.leftOffset ? item.leftOffset - item.originX : 0;
        let {
          endIndex: currentIndex,
          single,
          singleWidth,
        } = getTextSingleLine(text, width, singleLength, 0, widthOffset);
        x = resetTextPositionX(item, style, singleWidth);
        y = resetTextPositionY(item, style);
        ctx.fillText(single, x, y);
        leftOffset = x + singleWidth;
        topOffset = y;

        // 去除第一行补的内容，然后重置
        text = text.substring(currentIndex, text.length);
        currentIndex = 0;
        lineNum = Math.max(Math.floor(textWidth / width), 1);
        textWidth = measureWidth(text, style.font || ctx.font);
        item.x = item.originX; // 还原换行后的x
        for (let i = 0; i < lineNum; i++) {
          let { endIndex, single, singleWidth } = getTextSingleLine(
            text,
            width,
            singleLength,
            currentIndex
          );
          currentIndex = endIndex;
          if (single) {
            x = resetTextPositionX(item, style, singleWidth, width);
            y = resetTextPositionY(item, style, i + 1);
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
          x = resetTextPositionX(item, style, lastWidth, width);
          y = resetTextPositionY(item, style, lineNum + 1);
          ctx.fillText(last, x, y);
          leftOffset = x + lastWidth;
          topOffset = lineHeight * (lineNum + 1);
        }
      } else {
        x = resetTextPositionX(item, style, textWidth, width);
        y = resetTextPositionY(item, style);
        ctx.fillText(item.text, x, y);
        leftOffset = x + textWidth;
        topOffset = lineHeight;
      }
    } else {
      x = resetTextPositionX(item, style, textWidth, width);
      y = resetTextPositionY(item, style);
      ctx.fillText(item.text, x, y);
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

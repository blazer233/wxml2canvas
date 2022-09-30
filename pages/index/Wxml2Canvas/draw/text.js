import {
  transferPadding,
  measureWidth,
  cNum,
  getLineHeight,
  resetPositionX,
  resetPositionY,
  resetTextPositionX,
  resetTextPositionY,
  drawBoxShadow,
} from "../baseFun";
import { CONFIG_SET } from "../config";
import { drawTextBackgroud, getTextSingleLine } from "../tools";

export default (ctx, item, style, resolve, reject, type) => {
  let leftOffset = 0;
  let topOffset = 0;
  const { zoom } = CONFIG_SET();
  try {
    style.fontSize = cNum(style.fontSize);
    let fontSize = Math.ceil((style.fontSize || 14) * zoom);
    ctx.setTextBaseline("top");
    ctx.font = `${
      style.fontWeight ? style.fontWeight : "normal"
    } ${fontSize}px ${style.fontFamily || "PingFang SC"}`;
    ctx.setFillStyle(style.color || "#454545");
    console.log(1);
    let text = item.text || "";
    let textWidth = Math.floor(measureWidth(ctx, text, style.font || ctx.font));
    let lineHeight = getLineHeight(style);
    let textHeight =
      Math.ceil(textWidth / (style.width || textWidth)) * lineHeight;
    let width = Math.ceil(style.width || textWidth);
    let whiteSpace = style.whiteSpace || "wrap";
    let x = 0;
    let y = 0;
    if (typeof style.padding === "string") {
      style.padding = transferPadding(style.padding);
    }
    item.x = resetPositionX(item, style);
    item.y = resetPositionY(item, style, textHeight);
    console.log(2);
    drawBoxShadow(ctx, style.boxShadow);
    if (style.background || style.border) {
      drawTextBackgroud(ctx, item, style, textWidth, textHeight);
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
        } = getTextSingleLine(ctx, text, width, singleLength, 0, widthOffset);
        x = resetTextPositionX(item, style, singleWidth);
        y = resetTextPositionY(item, style);
        ctx.fillText(single, x, y);
        leftOffset = x + singleWidth;
        topOffset = y;

        // 去除第一行补的内容，然后重置
        text = text.substring(currentIndex, text.length);
        currentIndex = 0;
        lineNum = Math.max(Math.floor(textWidth / width), 1);
        textWidth = Math.floor(measureWidth(ctx, text, style.font || ctx.font));
        item.x = item.originX; // 还原换行后的x
        for (let i = 0; i < lineNum; i++) {
          let { endIndex, single, singleWidth } = getTextSingleLine(
            ctx,
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
        let lastWidth = measureWidth(ctx, last);

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
      // block文本，如果文本长度超过宽度换行
      if (width && textWidth > width && whiteSpace !== "nowrap") {
        let lineNum = Math.max(Math.floor(textWidth / width), 1);
        let length = text.length;
        let singleLength = Math.floor(length / lineNum);
        let currentIndex = 0;

        // lineClamp参数限制最多行数
        if (style.lineClamp && lineNum + 1 > style.lineClamp) {
          lineNum = style.lineClamp - 1;
        }

        for (let i = 0; i < lineNum; i++) {
          let { endIndex, single, singleWidth } = getTextSingleLine(
            ctx,
            text,
            width,
            singleLength,
            currentIndex
          );
          currentIndex = endIndex;
          x = resetTextPositionX(item, style, singleWidth, width);
          y = resetTextPositionY(item, style, i);
          ctx.fillText(single, x, y);
        }

        // 换行后剩余的文字，超过一行则截断增加省略号
        let last = text.substring(currentIndex, length);
        let lastWidth = measureWidth(ctx, last);
        if (lastWidth > width) {
          let { single, singleWidth } = getTextSingleLine(
            ctx,
            last,
            width,
            singleLength
          );
          lastWidth = singleWidth;
          last = single.substring(0, single.length - 1) + "...";
        }

        x = resetTextPositionX(item, style, lastWidth, width);
        y = resetTextPositionY(item, style, lineNum);
        ctx.fillText(last, x, y);
      } else {
        x = resetTextPositionX(item, style, textWidth, width);
        y = resetTextPositionY(item, style);
        console.log(3);
        ctx.fillText(item.text, x, y);
      }
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
    reject && reject({ errcode: 1004, errmsg: "drawText error", e: e });
  }
};

import { measureWidth, drawRectToCanvas } from "./drawFun";
import { CACHE_INFO } from "./config";
import drawText from "./draw/text";
import { transferPadding, tNum } from "./utils";

export const setBaseInfo = () => {
  const { ctx, options } = CACHE_INFO;
  const { background, font, width, height } = options;
  ctx.font = font;
  ctx.setTextBaseline("top");
  ctx.setStrokeStyle("white");
  drawRectToCanvas(0, 0, width, height, { fill: background });
};

// 以行进行分类
export const sortListByTop = list => {
  const [arrBlock, arrLine, lineTemp] = [[], [], {}];
  list.forEach(i => {
    if (i.dataset.type && i.dataset.type.indexOf("inline") == -1) {
      arrBlock.push(i);
    } else {
      arrLine.push(i);
    }
  });
  arrLine.forEach(i => {
    lineTemp[i.top] = lineTemp[i.top] || [];
    lineTemp[i.top].push(i);
  });
  return [arrBlock, lineTemp];
};

export const transferWxmlStyle = el => {
  const { options } = CACHE_INFO;
  const { left: limitLeft = 0, top: limitTop = 0 } = options.limit;
  let leftFix = +el.dataset.left || 0;
  let topFix = +el.dataset.top || 0;

  el.width = tNum(el.width);
  el.height = tNum(el.height);
  el.left = tNum(el.left) - limitLeft + leftFix;
  el.top = tNum(el.top) - limitTop + topFix;

  let padding = el.dataset.padding || options.PADDING;
  if (typeof padding === "string") {
    padding = transferPadding(padding);
  }
  let paddingTop = +el.paddingTop.replace("px", "") + +padding[0];
  let paddingRight = +el.paddingRight.replace("px", "") + +padding[1];
  let paddingBottom = +el.paddingBottom.replace("px", "") + +padding[2];
  let paddingLeft = +el.paddingLeft.replace("px", "") + +padding[3];
  el.padding = [paddingTop, paddingRight, paddingBottom, paddingLeft];
};

const drawAfter = (el, leftOffset, maxWidth) => {
  transferWxmlStyle(el);
  let text = el.dataset.text || "";
  el.background = el.dataset.background || el.backgroundColor;
  return {
    text,
    x: leftOffset || el.left,
    y: el.top,
    originX: el.left,
    ...(leftOffset && { leftOffset }),
    ...(maxWidth && { maxWidth }),
  };
};

// 用来限定位置范围，取相对位置
export const drawWxmlBlock = (block = []) =>
  block.map(
    el =>
      new Promise((resolve, reject) => {
        const textData = drawAfter(el);
        drawText(textData, el, resolve, reject, "text");
      })
  );

export const drawWxmlInline = inline => {
  let leftOffset = 0;
  return new Promise(resolve => {
    let maxWidth = 0;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    Object.keys(inline).forEach(top => {
      inline[top].forEach(el => {
        minLeft = Math.min(el.left, minLeft);
        maxRight = Math.max(el.right, maxRight);
      });
    });
    // 找出同一top下的最小left和最大right，得到最大的宽度，用于换行
    maxWidth = Math.ceil(maxRight - minLeft);
    Object.keys(inline).forEach(top => {
      inline[top].forEach(el => {
        const textData = drawAfter(el, leftOffset, maxWidth);
        const drawRes = drawText(textData, el, null, null, "inline-text");
        leftOffset = drawRes.leftOffset; // 每次绘制从上次结束地方开始
      });
    });
    resolve();
  });
};

export const drawTextBackgroud = (item, style, textWidth, textHeight) => {
  if (!style.width) return;
  let width = style.width || textWidth;
  let height = style.height || textHeight;
  let rectStyle = {
    fill: style.background,
    border: style.border,
  };
  style.padding = style.padding || [0, 0, 0, 0];
  width += (style.padding[1] || 0) + (style.padding[3] || 0);
  height += (style.padding[0] || 0) + (style.padding[2] || 0);
  console.log(item);
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
    offset--;
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

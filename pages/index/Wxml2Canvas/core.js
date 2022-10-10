import { measureWidth, drawRectToCanvas } from "./drawFun";
import { CACHE_INFO } from "./config";
import drawText from "./draw/text";
import { transferPadding, cNum } from "./utils";

export const setBaseInfo = () => {
  const { ctx, options } = CACHE_INFO;
  const { background, font, width, height } = options;
  const style = { fill: background };
  ctx.font = font;
  ctx.setTextBaseline("top");
  ctx.setStrokeStyle("white");
  drawRectToCanvas(0, 0, width, height, style);
};

// 以行进行分类
export const sortListByTop = list => {
  let [arrBlock, arrLine, lineTemp] = [[], [], {}];
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

export const transferWxmlStyle = (sub, item, limitLeft, limitTop) => {
  const { zoom, options } = CACHE_INFO;
  let leftFix = +sub.dataset.left || 0;
  let topFix = +sub.dataset.top || 0;

  sub.width = cNum(sub.width);
  sub.height = cNum(sub.height);
  sub.left = cNum(sub.left) - limitLeft + (leftFix + (item.x || 0)) * zoom;
  sub.top = cNum(sub.top) - limitTop + (topFix + (item.y || 0)) * zoom;

  let padding = sub.dataset.padding || options.PADDING;
  if (typeof padding === "string") {
    padding = transferPadding(padding);
  }
  let paddingTop = +sub.paddingTop.replace("px", "") + +padding[0];
  let paddingRight = +sub.paddingRight.replace("px", "") + +padding[1];
  let paddingBottom = +sub.paddingBottom.replace("px", "") + +padding[2];
  let paddingLeft = +sub.paddingLeft.replace("px", "") + +padding[3];
  sub.padding = [paddingTop, paddingRight, paddingBottom, paddingLeft];

  return sub;
};

const drawAfter = (sub, item, limitLeft, limitTop, leftOffset, maxWidth) => {
  sub = transferWxmlStyle(sub, item, limitLeft, limitTop);
  let text = sub.dataset.text || "";
  if (sub.dataset.maxlength && text.length > sub.dataset.maxlength) {
    text = text.substring(0, sub.dataset.maxlength) + "...";
  }
  const textData = {
    text,
    x: leftOffset || sub.left,
    y: sub.top,
    originX: sub.left,
    ...(leftOffset && { leftOffset }),
    ...(maxWidth && { maxWidth }),
  };
  sub.background = sub.dataset.background || sub.backgroundColor;
  return textData;
};

// 用来限定位置范围，取相对位置
export const drawWxmlBlock = (item, sorted = [], target = {}) => {
  let limitLeft = target.left || 0;
  let limitTop = target.top || 0;
  const all = [];
  sorted.forEach(sub => {
    all.push(
      new Promise((resolve, reject) => {
        const textData = drawAfter(sub, item, limitLeft, limitTop);
        drawText(textData, sub, resolve, reject, "text");
      })
    );
  });
  return all;
};

export const drawWxmlInline = (item, sorted, results = {}) => {
  let leftOffset = 0;
  let limitLeft = results.left || 0;
  let limitTop = results.top || 0;
  return new Promise(resolve => {
    let maxWidth = 0;
    let minLeft = Infinity;
    let maxRight = 0;
    // 找出同一top下的最小left和最大right，得到最大的宽度，用于换行
    Object.keys(sorted).forEach(top => {
      sorted[top].forEach(sub => {
        if (sub.left < minLeft) minLeft = sub.left;
        if (sub.right > maxRight) maxRight = sub.right;
      });
    });
    maxWidth = Math.ceil(maxRight - minLeft || self.width);
    Object.keys(sorted).forEach(top => {
      sorted[top].forEach(sub => {
        const textData = drawAfter(
          sub,
          item,
          limitLeft,
          limitTop,
          leftOffset,
          maxWidth
        );
        const drawRes = drawText(textData, sub, null, null, "inline-text");
        leftOffset = drawRes.leftOffset;
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

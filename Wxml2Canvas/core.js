import { drawRectToCanvas } from "./drawFun";
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

/**
 *
 * @param { array } list 待处理的节点
 * @returns array
 */
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

/**
 * 绘制块级元素
 * @param { array } block 需要绘制的块级元素
 */
export const drawWxmlBlock = (block = []) => {
  return block.map(
    el =>
      new Promise((resolve, reject) => {
        const textData = drawAfter(el);
        drawText(textData, el, resolve, reject, "text");
      })
  );
};

/**
 * 绘制行内元素
 * @param { object } inline 需要绘制的行内元素
 */
export const drawWxmlInline = (inline = {}) => {
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

/**
 * 返回节点的真实位置
 *
 * @param { object } el 需要渲染的节点
 * @param {*} leftOffset 从左侧开始绘制的起点
 * @param {*} maxWidth 一行文本的最大宽度
 * @returns 返回canvas位置
 */
const drawAfter = (el, leftOffset, maxWidth) => {
  transferWxmlStyle(el);
  const text = el.dataset.text || "";
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

/**
 * 从节点解析出 padding
 *
 * @param {object} el 节点元素
 */
export const transferWxmlStyle = el => {
  const { options } = CACHE_INFO;
  const { left: limitLeft = 0, top: limitTop = 0 } = options.limit;
  const leftFix = +el.dataset.left || 0;
  const topFix = +el.dataset.top || 0;

  el.width = tNum(el.width);
  el.height = tNum(el.height);
  el.left = tNum(el.left) - limitLeft + leftFix;
  el.top = tNum(el.top) - limitTop + topFix;

  let padding = el.dataset.padding || options.PADDING;
  if (typeof padding === "string") {
    padding = transferPadding(padding);
  }
  const paddingTop = +el.paddingTop.replace("px", "") + +padding[0];
  const paddingRight = +el.paddingRight.replace("px", "") + +padding[1];
  const paddingBottom = +el.paddingBottom.replace("px", "") + +padding[2];
  const paddingLeft = +el.paddingLeft.replace("px", "") + +padding[3];
  el.padding = [paddingTop, paddingRight, paddingBottom, paddingLeft];
};

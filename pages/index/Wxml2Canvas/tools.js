import {
  drawBoxShadow,
  setFill,
  drawBorder,
  cNum,
  transferPadding,
  measureWidth,
} from "./baseFun";
import { COMPUT_STYLE, CACHE_INFO } from "./config";
import drawText from "./draw/text";

export const drawRectToCanvas = (x, y, width, height, style) => {
  let { fill, border, boxShadow } = style;
  const { ctx } = CACHE_INFO;
  ctx.save();
  drawBoxShadow(boxShadow, shadow => {
    // 真机上填充渐变色时，没有阴影，先画个相等大小的纯色矩形来实现阴影
    if (fill && typeof fill !== "string") {
      ctx.setFillStyle(shadow.color || "#ffffff");
      ctx.fillRect(x, y, width, height);
    }
  });
  setFill(fill);
  ctx.fillRect(x, y, width, height);
  drawBorder(border, style, calBorder => {
    const fixBorder = calBorder.width;
    ctx.strokeRect(
      x - fixBorder / 2,
      y - fixBorder / 2,
      width + fixBorder,
      height + fixBorder
    );
  });

  ctx.draw(true);
  ctx.restore();
};

export const setBaseInfo = () => {
  const { ctx, options } = CACHE_INFO;
  const { background, font, width, height } = options;
  const style = { fill: background };
  ctx.font = font;
  ctx.setTextBaseline("top");
  ctx.setStrokeStyle("white");
  drawRectToCanvas(0, 0, width, height, style);
};

export const getWxml = item => {
  const { options } = CACHE_INFO;
  const { obj, width, zoom } = options;
  const query = obj
    ? wx.createSelectorQuery().in(obj)
    : wx.createSelectorQuery();
  const p1 = new Promise(resolve => {
    let once;
    query
      .selectAll(`${item.class}`)
      .fields(
        {
          dataset: true,
          size: true,
          rect: true,
          computedStyle: COMPUT_STYLE,
        },
        res => {
          if (!once) {
            once = true;
            resolve(res);
          }
        }
      )
      .exec();
  });
  const p2 = new Promise(resolve => {
    if (!item.limit) resolve({ top: 0, width: width / zoom });
    query
      .select(`${item.limit}`)
      .fields(
        {
          dataset: true,
          size: true,
          rect: true,
        },
        res => resolve(res)
      )
      .exec();
  });
  return Promise.all([p1, p2]);
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
  const { zoom } = CACHE_INFO;
  let leftFix = +sub.dataset.left || 0;
  let topFix = +sub.dataset.top || 0;

  sub.width = cNum(sub.width);
  sub.height = cNum(sub.height);
  sub.left = cNum(sub.left) - limitLeft + (leftFix + (item.x || 0)) * zoom;
  sub.top = cNum(sub.top) - limitTop + (topFix + (item.y || 0)) * zoom;

  let padding = sub.dataset.padding || "0 0 0 0";
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
  sub.background =
    sub.dataset.background || sub.backgroundColor || "rgba(0, 0, 0, 0)";
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

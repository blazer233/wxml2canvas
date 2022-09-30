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
  let query = obj ? wx.createSelectorQuery().in(obj) : wx.createSelectorQuery();
  let p1 = new Promise(resolve => {
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

  let p2 = new Promise(resolve => {
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

export const sortListByTop = list => {
  let sorted = {};
  // 粗略地认为2px相差的元素在同一行
  list.forEach(item => {
    let top = item.top;
    if (!sorted[top]) {
      if (sorted[top - 2]) {
        top = top - 2;
      } else if (sorted[top - 1]) {
        top = top - 1;
      } else if (sorted[top + 1]) {
        top = top + 1;
      } else if (sorted[top + 2]) {
        top = top + 2;
      } else {
        sorted[top] = [];
      }
    }
    sorted[top].push(item);
  });
  return sorted;
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

export const drawWxmlText = (sub, resolve, reject) => {
  let text = sub.dataset.text || "";
  if (sub.dataset.maxlength && text.length > sub.dataset.maxlength) {
    text = text.substring(0, sub.dataset.maxlength) + "...";
  }
  let textData = {
    text,
    x: sub.left,
    y: sub.top,
  };
  if (sub.backgroundColor !== "rgba(0, 0, 0, 0)") {
    sub.background = sub.backgroundColor;
  } else {
    sub.background = "rgba(0, 0, 0, 0)";
  }
  if (sub.dataset.background) {
    sub.background = sub.dataset.background;
  }
  drawText(textData, sub, resolve, reject, "text", "wxml");
};

export const drawWxmlBlock = (item, sorted, all, results) => {
  // 用来限定位置范围，取相对位置
  let limitLeft = results ? results.left : 0;
  let limitTop = results ? results.top : 0;
  Object.keys(sorted).forEach(top => {
    // 左 -> 右
    let list = sorted[top].sort((a, b) => a.left - b.left);
    list = list.filter(
      i => i.dataset.type && i.dataset.type.indexOf("inline") == -1
    );
    list.forEach((sub, index) => {
      all[index] = new Promise((resolve, reject) => {
        sub = transferWxmlStyle(sub, item, limitLeft, limitTop);
        let type = sub.dataset.type;
        if (type === "text") {
          drawWxmlText(sub, resolve, reject);
        }
      });
    });
  });
  return all;
};

export const drawWxmlInlineText = (sub, leftOffset = 0, maxWidth) => {
  let text = sub.dataset.text || "";
  if (sub.dataset.maxlength && text.length > sub.dataset.maxlength) {
    text = text.substring(0, sub.dataset.maxlength) + "...";
  }

  let textData = {
    text,
    originX: sub.left,
    x: leftOffset ? leftOffset : sub.left,
    y: sub.top,
    leftOffset: leftOffset,
    maxWidth: maxWidth, // 行内元素的最大宽度，取决于limit的宽度
  };

  if (sub.backgroundColor !== "rgba(0, 0, 0, 0)") {
    sub.background = sub.backgroundColor;
  } else {
    sub.background = "rgba(0, 0, 0, 0)";
  }

  if (sub.dataset.background) {
    sub.background = sub.dataset.background;
  }
  return drawText(textData, sub, null, null, "inline-text", "wxml");
};

export const drawWxmlInline = (item, sorted, all, results) => {
  let topOffset = 0;
  let leftOffset = 0;
  let lastTop = 0;
  let limitLeft = results ? results.left : 0;
  let limitTop = results ? results.top : 0;
  let p = new Promise(resolve => {
    let maxWidth = 0;
    let minLeft = Infinity;
    let maxRight = 0;
    // 找出同一top下的最小left和最大right，得到最大的宽度，用于换行
    Object.keys(sorted).forEach(top => {
      let inlineList = sorted[top].filter(
        i => i.dataset.type && i.dataset.type.indexOf("inline") > -1
      );
      inlineList.forEach(sub => {
        if (sub.left < minLeft) minLeft = sub.left;
        if (sub.right > maxRight) maxRight = sub.right;
      });
    });
    maxWidth = Math.ceil(maxRight - minLeft || self.width);

    Object.keys(sorted).forEach(top => {
      // 左 -> 右
      let list = sorted[top].sort((a, b) => a.left - b.left);

      // 换行的行内元素left放到后面，version2.0.6后无法获取高度，改用bottom值来判断是否换行了
      let position = -1;
      for (let i = 0, len = list.length; i < len; i++) {
        if (list[i] && list[i + 1]) {
          if (list[i].bottom > list[i + 1].bottom) {
            position = i;
            break;
          }
        }
      }

      if (position > -1) {
        list.push(list.splice(position, 1)[0]);
      }

      let inlineList = list.filter(
        sub => sub.dataset.type && sub.dataset.type.indexOf("inline") > -1
      );
      let originLeft = inlineList[0] ? inlineList[0].left : 0;
      // 换行后和top不相等时，认为是换行了，要清除左边距；当左偏移量大于最大宽度时，也要清除左边距; 当左偏移小于左边距时，也要清除
      if (
        Math.abs(topOffset + lastTop - top) > 2 ||
        leftOffset - originLeft - limitLeft >= maxWidth ||
        leftOffset <= originLeft - limitLeft - 2
      ) {
        leftOffset = 0;
      }
      lastTop = +top;
      topOffset = 0;
      inlineList.forEach(sub => {
        sub = transferWxmlStyle(sub, item, limitLeft, limitTop);
        let type = sub.dataset.type;
        if (type === "inline-text") {
          let drawRes = drawWxmlInlineText(sub, leftOffset, maxWidth);
          leftOffset = drawRes.leftOffset;
          topOffset = drawRes.topOffset;
        }
      });
    });
    resolve();
  });

  all.push(p);
  return all;
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

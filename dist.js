const DEFAULT_CONFIG = {
  TOP: "top",
  width: 340,
  FONT_SIZE: "14",
  PADDING: "0 0 0 0",
  FONT_COL: "#454545",
  SHADOW_COL: "#ffffff",
  background: "#ffffff",
  font: "14px PingFang SC",
};

const CACHE_INFO = {};

const setInit = (config = {}) => {
  const info = { ...DEFAULT_CONFIG, ...config };
  CACHE_INFO.options = info;
  CACHE_INFO.ctx = wx.createCanvasContext(info.element, info.obj);
  return arg => Object.keys(arg).forEach(i => (CACHE_INFO.options[i] = arg[i]));
};

const COMPUT_STYLE = [
  "width",
  "height",
  "font",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "textAlign",
  "color",
  "lineHeight",
  "border",
  "borderColor",
  "borderStyle",
  "borderWidth",
  "verticalAlign",
  "boxShadow",
  "background",
  "backgroundColor",
  "backgroundImage",
  "backgroundPosition",
  "backgroundSize",
  "paddingLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
];

const tNum = number =>
  isNaN(number) ? +(number || "").replace("px", "") : number;

const getLineHeight = style => {
  let lineHeight;
  style.lineHeight = `${style.lineHeight || ""}`;
  lineHeight = +style.lineHeight.replace("px", "");
  lineHeight = lineHeight ? lineHeight : (style.fontSize || 14) * 1.2;
  return lineHeight;
};

/**
 * 解析出内边距，依次为上右下左
 * @param { string } padding 内边距值
 */
const transferPadding = (padding = CACHE_INFO.options.PADDING) => {
  padding = padding.split(" ");
  for (let i = 0, len = padding.length; i < len; i++) {
    padding[i] = +padding[i].replace("px", "");
  }
  return padding;
};

const calTxt = (style, fontSize) =>
  `${style.fontWeight ? style.fontWeight : "normal"} ${fontSize}px ${
    style.fontFamily || "PingFang SC"
  }`;

const getWxml = item => {
  const { options } = CACHE_INFO;
  const { obj, width } = options;
  const query = obj
    ? wx.createSelectorQuery().in(obj)
    : wx.createSelectorQuery();
  const render = new Promise(resolve => {
    query
      .selectAll(item.class)
      .fields(
        {
          dataset: true,
          size: true,
          rect: true,
          computedStyle: COMPUT_STYLE,
        },
        res => resolve(res)
      )
      .exec();
  });
  const limit = new Promise(resolve => {
    if (!item.limit) resolve({ top: 0, width });
    query
      .select(item.limit)
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
  return Promise.all([render, limit]);
};

const measureWidth = (text, font) => {
  const { ctx } = CACHE_INFO;
  if (font) {
    ctx.font = font;
  }
  const res = ctx.measureText(text) || {};
  return Math.floor(res.width || 0);
};

/**
 * 文字的padding、text-align X Y
 * @param {*} textData
 * @param {*} el
 * @param {*} textWidth
 */
const setTxtAlign = (textData, el, textWidth, maxWidth, line = 0) => {
  const { options } = CACHE_INFO;
  const lineHeight = getLineHeight(el);
  const fontSize = Math.ceil(el.fontSize || options.FONT_SIZE);

  const blockLineHeightFix =
    ((el.dataset && el.dataset.type) || "").indexOf("inline") > -1
      ? 0
      : (lineHeight - fontSize) / 2;
  const top = el.padding ? el.padding[0] || 0 : 0;
  const textAlign = el.textAlign || "left";
  let x = textData.x;
  if (textAlign === "center") x = (maxWidth - textWidth) / 2 + textData.x;
  if (textAlign === "right") x = maxWidth - textWidth + textData.x;
  const left = el.padding ? el.padding[3] || 0 : 0;

  // x：x + 左边距
  // y：y + lineheight偏移 + 行数 + paddingTop
  return [x + left, textData.y + blockLineHeightFix + line * lineHeight + top];
};

/**
 * 通过样式绘制文字
 * @param {*} el
 */
const drawText = el => {
  const { ctx, options } = CACHE_INFO;
  el.fontSize = tNum(el.fontSize);
  const fontSize = Math.ceil(el.fontSize || options.FONT_SIZE);
  ctx.setTextBaseline("top");
  ctx.font = calTxt(el, fontSize);
  ctx.setFillStyle(el.color || options.FONT_COL);
};

const drawRectToCanvas = (x, y, width, height, el) => {
  const { fill } = el;
  const { ctx, options } = CACHE_INFO;
  ctx.save();
  ctx.setShadow(0, 0, 0, options.SHADOW_COL);
  ctx.setFillStyle(fill);
  ctx.fillRect(x, y, width, height);
  ctx.draw(true);
  ctx.restore();
};

/**
 *
 * @param { object } item
 * @param { object } style
 * @param { number } textWidth
 * @param { number } textHeight
 * @returns
 */
const drawTextBackgroud = (item, style, textWidth, textHeight) => {
  if (!style.width) return;
  let width = style.width || textWidth;
  let height = style.height || textHeight;
  const rectStyle = { fill: style.background, border: style.border };
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
const getTextSingleLine = (
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
    offset -= 1;
    endIndex = currentIndex + singleLength + offset;
    single = text.substring(currentIndex, endIndex);
    singleWidth = measureWidth(single);
  }

  return [endIndex, single, singleWidth];
};

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

const setBaseInfo = () => {
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
const sortListByTop = list => {
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
const drawWxmlBlock = (block = []) => {
  return block.map(
    el =>
      new Promise((resolve, reject) => {
        const textData = drawAfter(el);
        DrawTxt(textData, el, resolve, reject, "text");
      })
  );
};

/**
 * 绘制行内元素
 * @param { object } inline 需要绘制的行内元素
 */
const drawWxmlInline = (inline = {}) => {
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
        const drawRes = DrawTxt(textData, el, null, null, "inline-text");
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
const transferWxmlStyle = el => {
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

var index = config =>
  new Promise(async (resolve, reject) => {
    const appendSet = setInit(config); // 配置基础
    setBaseInfo(); // 设置底色
    const exec = config.options;
    const [render, limit] = await getWxml(exec); // 获取待绘制元素、限制区域
    const [block, inlineTmp] = sortListByTop(render); // 划分块级元素 \ 行内元素
    appendSet({ limit }); // 追加配置
    const result = [...drawWxmlBlock(block), drawWxmlInline(inlineTmp)];
    Promise.all(result).then(resolve).catch(reject);
  });

export { index as default };

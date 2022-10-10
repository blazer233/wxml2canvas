import { CACHE_INFO, COMPUT_STYLE } from "./config";

export const transferBorder = (border = "") => {
  let res = border.match(/(\w+)px\s(\w+)\s(.*)/);
  let obj = {};
  if (res) {
    let [, width, style, color] = res;
    obj = { width: +width, style, color };
  }
  return obj;
};

export const cNum = number => {
  return isNaN(number) ? +(number || "").replace("px", "") : number;
};

export const getLineHeight = style => {
  const { zoom } = CACHE_INFO.options;
  let lineHeight;
  if (!isNaN(style.lineHeight) && style.lineHeight > style.fontSize) {
    lineHeight = style.lineHeight;
  } else {
    style.lineHeight = (style.lineHeight || "") + "";
    lineHeight = +style.lineHeight.replace("px", "");
    lineHeight = lineHeight ? lineHeight : (style.fontSize || 14) * 1.2;
  }
  return lineHeight * zoom;
};

/**
 * 内边距，依次为上右下左
 * @param {*} padding
 */
export const transferPadding = (padding = "0 0 0 0") => {
  padding = padding.split(" ");
  for (let i = 0, len = padding.length; i < len; i++) {
    padding[i] = +padding[i].replace("px", "");
  }
  return padding;
};

export const calTxt = (style, fontSize) => {
  return `${style.fontWeight ? style.fontWeight : "normal"} ${fontSize}px ${
    style.fontFamily || "PingFang SC"
  }`;
};

export const getWxml = item => {
  const { options } = CACHE_INFO;
  const { obj, width, zoom } = options;
  const query = obj
    ? wx.createSelectorQuery().in(obj)
    : wx.createSelectorQuery();
  const p1 = new Promise(resolve => {
    query
      .selectAll(`${item.class}`)
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

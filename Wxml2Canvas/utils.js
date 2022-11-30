import { CACHE_INFO, COMPUT_STYLE } from "./config";

export const transferNum = number =>
  isNaN(number) ? +(number || "").replace("px", "") : number;

export const getLineHeight = style => {
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
export const transferPadding = (padding = CACHE_INFO.options.PADDING) => {
  padding = padding.split(" ");
  for (let i = 0, len = padding.length; i < len; i++) {
    padding[i] = +padding[i].replace("px", "");
  }
  return padding;
};

export const calTxt = (style, fontSize) =>
  `${style.fontWeight ? style.fontWeight : "normal"} ${fontSize}px ${
    style.fontFamily || "PingFang SC"
  }`;

export const getWxml = item => {
  const { options } = CACHE_INFO;
  const { _this, width } = options;
  const query = _this
    ? wx.createSelectorQuery().in(_this)
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

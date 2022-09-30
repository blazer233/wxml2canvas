import { CONFIG_SET } from "./config";
import {
  setBaseInfo,
  getWxml,
  sortListByTop,
  drawWxmlBlock,
  drawWxmlInline,
} from "./tools.js";

export default config => {
  const options = CONFIG_SET(config);
  const ctx = wx.createCanvasContext(options.element, options.obj);
  setBaseInfo(ctx);
  let index = 0;
  let cacheAll = [];
  config.list.forEach(item => {
    cacheAll[index] = new Promise(async (resolve, reject) => {
      let all = [];
      const [base, target] = await getWxml(item);
      const sorted = sortListByTop(base);
      // 上 -> 下
      all = drawWxmlBlock(ctx, item, sorted, all, target);
      all = drawWxmlInline(ctx, item, sorted, all, target);
      Promise.all(all).then(resolve).catch(reject);
    });
    index += 1;
  });
};

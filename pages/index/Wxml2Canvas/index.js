import { GET_INIT } from "./config";
import {
  setBaseInfo,
  getWxml,
  sortListByTop,
  drawWxmlBlock,
  drawWxmlInline,
} from "./tools.js";

export default config => {
  GET_INIT(config);
  setBaseInfo();
  let index = 0;
  let cacheAll = [];
  config.list.forEach(item => {
    cacheAll[index] = new Promise(async (resolve, reject) => {
      let all = [];
      const [base, target] = await getWxml(item);
      const sorted = sortListByTop(base);
      // 上 -> 下
      all = drawWxmlBlock(item, sorted, all, target);
      all = drawWxmlInline(item, sorted, all, target);
      Promise.all(all).then(resolve).catch(reject);
    });
    index += 1;
  });
};

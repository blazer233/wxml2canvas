import { GET_INIT } from "./config";
import {
  setBaseInfo,
  getWxml,
  sortListByTop,
  drawWxmlBlock,
  drawWxmlInline,
} from "./tools.js";

export default config => {
  return new Promise(async (resolve, reject) => {
    GET_INIT(config);
    setBaseInfo();
    for (let i = 0; i < config.list.length; i++) {
      const item = config.list[i];
      let all = [];
      const [base, target] = await getWxml(item);
      const sorted = sortListByTop(base);
      // 上 -> 下
      all = drawWxmlBlock(item, sorted, all, target);
      all = drawWxmlInline(item, sorted, all, target);
      Promise.all(all).then(resolve).catch(reject);
    }
  });
};

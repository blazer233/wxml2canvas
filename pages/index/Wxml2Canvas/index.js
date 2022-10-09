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
    const exec = config.options;
    const [base, target] = await getWxml(exec);
    const [block, inline] = sortListByTop(base);
    const result = [
      ...drawWxmlBlock(exec, block, target),
      drawWxmlInline(exec, inline, target),
    ];
    Promise.all(result).then(resolve).catch(reject);
  });
};

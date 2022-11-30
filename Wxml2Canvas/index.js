import { setInit } from "./config";
import {
  sortListByTop,
  drawWxmlBlock as drawB,
  drawWxmlInline as drawL,
} from "./core.js";
import { getWxml } from "./utils";

export default config => {
  return new Promise(async (resolve, reject) => {
    const appendSet = setInit(config); // 配置基础
    const [render, limit] = await getWxml(config.options); // 获取待绘制元素、限制区域
    appendSet({ limit }); // 追加配置
    const [block, inlineTmp] = sortListByTop(render); // 划分块级元素 \ 行内元素
    Promise.all([...drawB(block), drawL(inlineTmp)])
      .then(resolve)
      .catch(reject);
  });
};

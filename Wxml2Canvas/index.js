import { setInit } from "./config";
import {
  setBaseInfo,
  sortListByTop,
  drawWxmlBlock as drawB,
  drawWxmlInline as drawL,
} from "./core.js";
import { getWxml } from "./utils";

export default config =>
  new Promise(async (resolve, reject) => {
    const appendSet = setInit(config); // 配置基础
    setBaseInfo(); // 设置底色
    const exec = config.options;
    const [render, limit] = await getWxml(exec); // 获取待绘制元素、限制区域
    const [block, inlineTmp] = sortListByTop(render); // 划分块级元素 \ 行内元素
    appendSet({ limit }); // 追加配置
    const result = [...drawB(block), drawL(inlineTmp)];
    Promise.all(result).then(resolve).catch(reject);
  });

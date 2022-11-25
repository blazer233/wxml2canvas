import { GET_INIT } from "./config";
import {
  setBaseInfo,
  sortListByTop,
  drawWxmlBlock,
  drawWxmlInline,
} from "./core.js";
import { getWxml } from "./utils";
export default config => {
  return new Promise(async (resolve, reject) => {
    GET_INIT(config); // 配置基础
    setBaseInfo(); // 设置底色
    const exec = config.options;
    const [render, limit] = await getWxml(exec); // 获取待绘制元素、限制区域
    const [block, inlineTmp] = sortListByTop(render); // 划分块级元素 \ 行内元素
    const result = [
      ...drawWxmlBlock(block, limit),
      drawWxmlInline(inlineTmp, limit),
    ];
    Promise.all(result).then(resolve).catch(reject);
  });
};

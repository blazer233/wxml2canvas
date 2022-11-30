# 实现一个小程序 wxml2canvas🎅

![image.webp](https://raw.githubusercontent.com/blazer233/algorithm-learn/main/npm-learn/fsm/stately/image.webp)

> 项目代码：https://github.com/blazer233/algorithm-learn/tree/main/npm-learn/fsm/stately
>
>
> 参考轮子：https://github.com/fschaefer/Stately.js


我们经常会遇上动态生成海报的需求，而在小程序中，生成图片非Canvas莫属。但是在实际工作当中，为了追求效率，我们会不可避免地去使用一些JS插件，而`wxml-to-canvas`(https://github.com/wechat-miniprogram/wxml-to-canvas) 就是一款官方推荐且非常优秀的插件，它可以轻松地帮你将HTML代码转换成Canvas，进而生成可保存分享的图片。

但是`wxml-to-canvas`是通过静态模板和样式绘制 canvas ，进而导出图片，需要单独写一份静态模板用于编译，对于很多场景还是有些限制，比如有时需要将图文混排的富文本内容生成分享图，对于这种长度不定，内容动态变化的图片生成需求，直接利用官方的canvas接口绘制是十分困难的，包括但不限于文字换行、表情文字图片混排、文字加粗、子标题等元素都需要一一绘制


我们的目标是实现一个通过`wxml`节点标记，收集元素从而进行编译转换，仅依赖`wxml`直出需要绘制的canvas进而快速实现图片分享

* 此文暂不讨论图片类型的`wxml`转`canvas`


#### 先看结果🌰

我们针对简单的demo进行处理，包含了对`块级元素`、`行内元素`、`背景色`、等简单样式的转换，达到 `wxml`->`canvas`->`image` 的一次性处理，且不需要重复书写静态代码模板进行编译

下面让我们一步步探求如何实现这个tiny版的`wxml2canvas`
#### 实现

小程序提供了如下特性，可供我们便捷使用：

- measureText接口能直接测量出文本的宽度；
- SelectorQuery可以查询到节点对应的computedStyle。

同时小程序也存在一些弊端，比如：

- canvas属于原生组件，在移动端会置于最顶层；
- 通过SelectorQuery只能拿到节点的style，而无法获取文本节点的内容

所以我们第一步获取元素就面临两个问题:

1. 如何获取需要转成canvas的元素 
2. 如何拿到获取元素的对应属性（样式、节点、内容...）

当获取到待收集的元素后，就可以将元素绘制到指定的canvas上，也就实现了`wxml2canvas`

所以初始化时，需要传入如下参数

```js
/**
 * element：需要渲染的canvas节点
 * class：查找所有类名为exc-c的节点，并进行加入绘制队列
 * limit：限定相对位置 
 *
 **/
wxml2Canvas({
  element: "over-canvas",
  options: {
    class: ".exc-c",
    limit: ".limit-r",
  },
})
```

在wxml中需要绘制的元素需添加 `exc-c` 类名，方便对元素进行查找，并且如果需要限定相对位置，也需要在父级添加 `limit-r` 类名，例如，一个文本的位置(left, top) = (50, 80)，class为panel的节点的位置为(left, top) = (20, 40)，则文本canvas上实际绘制的位置(x, y) = (50 - 20, 80 -40) = (30, 40)。如果不传入limit，则以实际的位置(x, y) = (50, 80) 绘制

对于 `wxml` 而言，如有需要渲染的文本，也需要将文本内容通过 `data-text="xxx"` 属性的方式进行挂载，因为 `SelectorQuery` 无法获取文本节点的内容但是可以获取到节点的 `dataset` 属性，从而拿到文本内容

`wxml` 代码如下：

```js

<view class="content">Wxml:</view>
  <view class="-box limit-r">
    <view class="-line exc-c" data-type="inline-text" data-text="这是{{txt}}">这是{{txt}}</view>
    <view class="-line -blue exc-c" data-type="inline-text" data-text="这是蓝色行内文字试试">
      这是蓝色行内文字试试
    </view>
    <view class="-line exc-c" data-type="inline-text" data-text="这是换行的行内行内行内行内行内行内行内行内行内行行内行内内文字">
      这是换行的行内行内行内行内行内行行内行内内行内行内行内行内文字
    </view>
    <view class="-line -red exc-c" data-type="inline-text" data-text="这是红色行内红色行内红色行内红色行内文字试试">
      这是红色行内红色行内红色行内红色行内文字试试
    </view>
    <view class="-il exc-c" data-type="text" data-text="这是无边距文字">这是无边距文字</view>
    <view class="-il-2 exc-c" data-type="text" data-text="这是margin文字">这是margin文字</view>
    <view class="-il-3 exc-c" data-type="text" data-text="这是padding文字">这是padding文字</view>
    <view class="-il-4 exc-c" data-type="text" data-text="这是居中有背景文字">这是居中有背景文字</view>
    <view class="-il-5 exc-c" data-type="text" data-text="这是背景文字" data-background="rgba(255, 0, 0, 0.4)" data-padding="0 0 0 0">
      这是背景文字
    </view>
  </view>
  <view class="content">Canvas:</view>
  <canvas canvas-id="over-canvas" class="-box"></canvas>
```
...

上面是需要配置的代码，那下面让我看看如何具体实现：

1. 配置基础的样式 如：字体大小、颜色、边距，并返回一个函数用来追加配置
2. 解析元素 拿到所有需要绘制的元素以及相对的父级元素
3. 按照是否涉及换行进行分类绘制 (块级元素 / 行内元素)
4. 全部绘制结束时进行 `resolve`

```js
const Wxml2Canvas = config => {
  return new Promise(async (resolve, reject) => {
    const appendSet = setInit(config); // 配置基础
    const [render, limit] = await getWxml(config.options); // 获取待绘制元素、限制区域
    const [block, inlineTmp] = sortListByTop(render); // 划分块级元素 \ 行内元素
    appendSet({ limit }); // 追加配置
    Promise.all([...drawB(block), drawL(inlineTmp)]).then(resolve).catch(reject);
  });
};
```

#### 初始化基本属性

在上面代码中，通过 `setInit` 设置 `canvas` 的基本属性，并将可配置的默认参数（宽度、字体大小、字体颜色...）以及 `ctx` 维护成一个对外暴露的公共对象，最后返回一个函数，供使用者更新配置

```js
const DEFAULT_CONFIG = {
  width: 340,
  TOP: "top",
  FONT_SIZE: "14",
  PADDING: "0 0 0 0",
  FONT_COL: "#454545",
  SHADOW_COL: "#ffffff",
  background: "#ffffff",
  font: "14px PingFang SC",
  STROKECOLOR: "white",
};

export const CACHE_INFO = {};

export const setInit = (config = {}) => {
  const info = { ...DEFAULT_CONFIG, ...config };
  const { background, font, width, height, TOP, STROKECOLOR } = info;
  CACHE_INFO.options = info;
  CACHE_INFO.ctx = wx.createCanvasContext(info.element, info._this);
  CACHE_INFO.ctx.font = font;
  CACHE_INFO.ctx.setTextBaseline(TOP);
  CACHE_INFO.ctx.setStrokeStyle(STROKECOLOR); // 设置基本样式
  drawRectToCanvas(0, 0, width, height, { fill: background });
  return arg => Object.keys(arg).forEach(i => (CACHE_INFO.options[i] = arg[i]));
};
```

#### 获取元素

在 `getWxml` 中，通过小程序提供的 `createSelectorQuery` 获取到需要绘制元素的节点信息，同时也获取父级相对元素的节点信息，作为 `limit` 界定绘制元素的边界

```js
/**
 * @param { object } item 待处理的节点
 * @returns array 解析后的节点信息
 */
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
```

其中 `COMPUT_STYLE` 规定了需要查找的元素样式名称：

```js
export const COMPUT_STYLE = [
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

```
获取到相对父级元素，将获取的节点作为边界信息更新到配置中

```js
appendSet({ limit }); // 追加配置
```

---


获取到的元素可以分为两类 即：
- 涉及文字换行的元素 （行内元素）
- 不涉及文字换行的元素 （块级元素）

我们可以通过在书写 `wxml` 时，通过事先声明 `data-type="inline-text"` ，这样获取到节点之后，可以通过 `dataset` 获取元素的类型，如果为行内元素时，需要将行内元素通过高度进行分层，将同一行的元素进行归类

```js
/**
 * @param { array } list 待处理的节点
 * @returns array
 */
export const sortListByTop = list => {
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
```

#### 处理元素

通过 `drawWxmlBlock` 和 `drawWxmlInline` 分别对元素进行处理和绘制，在此之前还需要 `drawAfter` 方法将节点信息（文字、位置...） + 元素的样式信息（padding、width...） 转化为对应的 `canvas` 位置信息:

drawAfter：

```js
/**
 * 返回节点的真实位置
 *
 * @param { object } el 需要渲染的节点
 * @param {*} leftOffset 从左侧开始绘制的起点
 * @param {*} maxWidth 一行文本的最大宽度
 * @returns 返回canvas位置
 */
const drawAfter = (el, leftOffset, maxWidth) => {
  const { options } = CACHE_INFO;
  const { left: limitLeft = 0, top: limitTop = 0 } = options.limit;
  const leftFix = +el.dataset.left || 0;
  const topFix = +el.dataset.top || 0;

  el.width = transferNum(el.width);
  el.height = transferNum(el.height);
  el.left = transferNum(el.left) - limitLeft + leftFix;
  el.top = transferNum(el.top) - limitTop + topFix;

  let padding = el.dataset.padding || options.PADDING;
  if (typeof padding === "string") {
    padding = transferPadding(padding);
  }
  const paddingTop = +el.paddingTop.replace("px", "") + +padding[0];
  const paddingRight = +el.paddingRight.replace("px", "") + +padding[1];
  const paddingBottom = +el.paddingBottom.replace("px", "") + +padding[2];
  const paddingLeft = +el.paddingLeft.replace("px", "") + +padding[3];
  el.padding = [paddingTop, paddingRight, paddingBottom, paddingLeft];
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
```

drawWxmlBlock:

对于块级元素，将转为 `canvas` 位置信息的节点依次绘制，通过 `Promise` 将绘制完成的结果进行返回

```js
/**
 * 绘制块级元素
 * @param { array } block 需要绘制的块级元素
 */
export const drawWxmlBlock = (block = []) => {
  return block.map(
    el =>
      new Promise((resolve, reject) => {
        const textData = drawAfter(el);
        drawText(textData, el, "text", resolve, reject,);
      })
  );
};
```

drawWxmlInline:

![image.webp](https://raw.githubusercontent.com/blazer233/algorithm-learn/main/npm-learn/fsm/stately/image.webp)

对于行内元素，首先通过同一个行元素的左右边距计算出一行的最大宽度，用于换行，并且记录距离左侧的边距 `leftOffset` ，每次绘制完更新下一次绘制的起点，从上次结束的位置继续绘制，全部绘制完成后进行 `resolve`
（有些贪心算法的影子）

```js
/**
 * 绘制行内元素
 * @param { object } inline 需要绘制的行内元素
 */
export const drawWxmlInline = (inline = {}) => {
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
        const textData = drawAfter(el, leftfOfset, maxWidth);
        const drawRes = drawText(textData, el, "inline");
        leftOffset = drawRes.leftOffset; // 每次绘制从上次结束地方开始
      });
    });
    resolve();
  });
};
```

#### 渲染节点

无论是块级元素还是行内元素都是通过 `drawText` 方法最终渲染节点到指定的 `canvas` 中，只不过传参会发生变化，`块级元素` 每次绘制都是独立的，所以每次绘制成功之后会触发 `resolve` 的回调，但是行内元素，每次绘制需要返回当前绘制结束之后的定位，以此作为下次绘制的起始位置。

块级元素：

```js
/**
 * 绘制文字 
 * @param { object } textData 节点位置
 * @param { object } el 节点信息
 * @param { string } type 渲染节点类型
 * @param { function } resolve 成功时候抛出
 * @param { function } reject 失败时候抛出
 */
const DrawTxt = (textData, el, type, resolve, reject) => {
  const { ctx, options } = CACHE_INFO;
  try {
    ...
    [x, y] = setTxtAlign(textData, el, textWidth, width);
    ctx.fillText(textData.text, x, y);
    ctx.draw(true);
    resolve();
  } catch (e) {
    reject && reject(e);
  }
};
```

以上对于块级元素时，我们只需要结合 `textAlign` 和 `padding` 就可以计算出 `x` 的值，通过 `行数 * 行高` 和 `padding` 计算出 `y` 的值，最后通过 `ctx.fillText` 进行绘制


行内元素：

```js
/**
 * 绘制文字 
 * @param { object } textData 节点位置
 * @param { object } el 节点信息
 */
const DrawTxt = (textData, el) => {
  const { ctx, options } = CACHE_INFO;
  ...
  // 元素换行的情况：
  const maxw = textData.maxWidth; // 最大宽度
  let lineNum = Math.max(Math.floor(textWidth / maxw), 1); // 最大行数
  const singleLength = Math.floor(text.length / lineNum); // 每行字数
  const widthOffset = textData.leftOffset - textData.originX; // 计算真实的左边距
  let [endIdx, fSingle, fsWidth] = getTextSingleLine(text, maxw, singleLength, 0, widthOffset);
  [x, y] = setTxtAlign(textData, el, fsWidth);
  ctx.fillText(fSingle, x, y); // 绘制
  leftOffset = x + fsWidth; // 更新左边距
  topOffset = y; // 更新右边距
  ...
  ctx.draw(true);
  return { leftOffset, topOffset }
};
```

上面行内元素，需要关心的是 `getTextSingleLine` 方法，即计算截取换行文字的索引和位置，通过 `offset` 矫正每行的真实文本数，如果 `真实文本距离 + 左边距 > 一行最大长度` 则不断进行截取，并且更新一行的文本字数，直到不超过一行最大长度时，返回截取的文字索引、截取的文字、截取后的文本长度


getTextSingleLine：

```js
/**
 * 当文本超过宽度时，计算每一行应该绘制的文本
 *
 * @param {*} text 需要绘制的文字
 * @param {*} width 一行最大长度
 * @param {*} singleLength 每行实际字数
 * @param {*} currentIndex 文字的起始位置索引
 * @param {*} widthOffset 左边距
 */
export const getTextSingleLine = (
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
```

## 总结

这个 `fsm有限状态机` 主要完成了：

1. 状态的可观测
2. 状态的链式调用
3. 状态变化的钩子函数

以上就是 npm 包 [stately](https://github.com/fschaefer/Stately.js) 的源码学习。

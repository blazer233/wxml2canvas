/**
 * type1: 0, 25, 17, rgba(0, 0, 0, 0.3)
 * type2: rgba(0, 0, 0, 0.3) 0px 25px 17px 0px => (0, 25, 17, rgba(0, 0, 0, 0.3))
 * @param {*} shadow
 */
export function transferBoxShadow(shadow = "") {
  if (!shadow || shadow === "none") return;
  let color;
  let split;
  split = shadow.match(/(\w+)\s(\w+)\s(\w+)\s(rgb.*)/);
  if (split) {
    split.shift();
    shadow = split;
    color = split[3] || "#ffffff";
  } else {
    split = shadow.split(") ");
    color = split[0] + ")";
    shadow = split[1].split("px ");
  }
  return {
    offsetX: +shadow[0] || 0,
    offsetY: +shadow[1] || 0,
    blur: +shadow[2] || 0,
    color,
  };
}

export function transferBorder(border = "") {
  let res = border.match(/(\w+)px\s(\w+)\s(.*)/);
  let obj = {};
  if (res) {
    obj = {
      width: +res[1],
      style: res[2],
      color: res[3],
    };
    return obj;
  }
}

export function calTxt(style, fontSize) {
  return `${style.fontWeight ? style.fontWeight : "normal"} ${fontSize}px ${
    style.fontFamily || "PingFang SC"
  }`;
}

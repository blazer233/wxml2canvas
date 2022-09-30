import wxml2Canvas from "./Wxml2Canvas/index";
Page({
  data: {
    imgs: [],
  },

  onLoad() {
    wxml2Canvas({
      width: 340,
      height: 210,
      element: "canvas1",
      background: "#f0f0f0",
      list: [
        {
          type: "wxml",
          class: ".share__canvas1 .draw_canvas",
          limit: ".share__canvas1",
          x: 0,
          y: 0,
        },
      ],
    });
  },

  saveImage(evt) {
    let index = evt.target.dataset.index;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imgs[index],
      success(res) {
        wx.showToast({
          title: "保存成功",
          icon: "success",
        });
      },
      fail() {
        wx.showToast({
          title: "保存失败",
          icon: "none",
        });
      },
    });
  },
});

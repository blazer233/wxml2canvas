import wxml2Canvas from "./Wxml2Canvas/index";
Page({
  data: {
    imageInfo: "",
  },

  onLoad() {
    this.init();
  },
  async init() {
    await wxml2Canvas({
      width: 340,
      height: 250,
      element: "canvas1",
      background: "#f0f0f0",
      options: {
        type: "wxml",
        class: ".draw_canvas",
        limit: ".share__canvas1",
      },
    });
    wx.canvasToTempFilePath({
      width: 340,
      height: 250,
      canvasId: "canvas1",
      success: res => {
        this.setData({ imageInfo: res.tempFilePath });
      },
    });
  },
  saveImage() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imageInfo,
      success() {
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

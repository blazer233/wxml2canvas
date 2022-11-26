import wxml2Canvas from "./Wxml2Canvas/index";
Page({
  data: {
    imageInfo: "",
  },

  onLoad() {
    this.init();
  },
  async init() {
    const res = await wxml2Canvas({
      width: 340,
      height: 250,
      element: "over-canvas",
      background: "#f0f0f0",
      options: {
        class: ".exc-c",
        limit: ".limit-r",
      },
    });
    console.log(res);
    wx.canvasToTempFilePath({
      width: 340,
      height: 250,
      canvasId: "over-canvas",
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

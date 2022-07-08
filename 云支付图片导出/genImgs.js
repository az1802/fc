const path = require("path");
const request = require('request');
const fs = require('fs');
const menuJson = require('./menu.json');
const { DisheGrpInfo } = menuJson;

let imgsArr = [];
DisheGrpInfo.forEach(groupItem => {
  groupItem.dishesinfo.forEach(item => {
    item.bigimg && imgsArr.push(item.bigimg)
  })
})


function genImgs() {
  imgsArr.forEach(async (url, index) => {
    await request(encodeURI(url)).pipe(fs.createWriteStream(path.join(__dirname, "imgs", `${index}.png`)));
  })
}

genImgs();
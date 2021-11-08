
const fs = require("fs");
const path = require("path");
const request = require('request');

let info = require('./info.json');
let goods = info.DisheGrpInfo;
let imgs = []

goods.forEach(item => {
  item.dishesinfo.forEach(food => {
    imgs.push(food.bigimg)
  })
})


imgs.forEach((imgUrl, index) => {
  request(imgUrl).pipe(fs.createWriteStream(path.join('imgs', String(index)+".jpg")))
})

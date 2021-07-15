var path = require("path");
const request = require('request')
var fs = require("fs");
const { resolve } = require("path");
var xlsx = require('node-xlsx');
const JSZIP = require('jszip');
var officegen = require('officegen');
var docx = officegen('docx');//word
const axios = require("axios")
let noImgUrls = []

// 创建目录
function mkdirSync(path) {
  if (!fs.existsSync(path)) { 
    fs.mkdirSync(path);
  }
}
// 格式化文件名称
function formatFileName(name) { 
  return name.replace(/\//ig, "-")
}
async function genImgs(allFoods) { 

  let shopDir = path.join(__dirname,"foodImgs");
  mkdirSync(shopDir)
  // 生成菜品图片文件夹 
  allFoods.forEach(foodItem => {
    let imgUrl = foodItem.picUrl;
    let imgName = formatFileName(foodItem.name) + ".jpg"
    // console.log("imgUrl--",imgUrl)
    if (imgUrl) {
      try {
        request(imgUrl).pipe(fs.createWriteStream(path.join(shopDir, imgName.trim())))
        
      } catch (err) { 
        noImgUrls.push(imgName)
        console.log(imgName,"下载错误")
      }
    } else { 
      noImgUrls.push(imgName)
    }
  })

  fs.writeFileSync(path.join(shopDir, "没有成功爬取的图片.txt"),"没有成功爬取的图片:"+noImgUrls.join(","))
}

async function logInfo(info, fileName = "test.json") {
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}


let foodsData = require("./foods.json")
let foodSpuTags = foodsData.data.food_spu_tags;


let allFoods = []

foodSpuTags.forEach(spuItem => {
  spuItem.spus.forEach(foodItem => {
    allFoods.push({
      name: foodItem.name,
      price: 0,
      picUrl: foodItem.picture,
      props:[]
    })
  })
})

logInfo(allFoods, "allFoods")

genImgs(allFoods)

// 生成图片库





console.log(allFoods.length)
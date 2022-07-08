const fs = require("fs");

const { resolve } = require("path");
const path = require("path");
const request = require('request')
const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genSpecificationsWord,genFeieExcelAll} = require("../utils/index")
const defaultImgUrl = ""


// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"
const findJsonLen = 5
const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[ "规格" ],//规格
  practice: [
    '规格', 	"可选",
  ],//做法
  feeding:["加料"],//加料
  remarks: [],//备注
  propsGroupSort: [
    '规格', 	"可选",
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

let merchantInfo = require("./shopData.json");
merchantInfo = merchantInfo.data
const categories = merchantInfo.union_categorys
let categoryObj = {}

let shopName = "陈家小吃（Holle广场店）";


// 处理规格属性部分
function formatFoodProps(foodDetail) {
  let res = []

  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() {
  let allFoods = {

  };

  let files = fs.readdirSync("./dataJson");
  console.log('files: ', files.length);
  files.forEach(filePath=>{
    let goodList = JSON.parse(fs.readFileSync(path.resolve(__dirname,"./dataJson",filePath), "utf-8")).data.goods_list;
    goodList.forEach(goodItem=>{
      if(!allFoods[goodItem.category_id]){allFoods[goodItem.category_id]=[]};
      allFoods[goodItem.category_id].push(goodItem);
    })
  })

  let categoryArr = categories.map((categoryItem)=>{
    let categoryDishes= allFoods[categoryItem.category_id] || [];
    return {
      name: categoryItem.category_name,
      foods:categoryDishes.map(foodItem=>{
        let foodTemp = {
          name:foodItem.name || "",
          picUrl:  foodItem.image_full_url || foodItem.image_url || foodItem.image_urls_list[0],
          price:foodItem.price,
          unit: foodItem.unit || "份",
          categoryName:categoryItem.category_name,
          props:formatFoodProps(foodItem),
        }
        foodTemp.name = foodTemp.name.replace(/\//ig, '-');
        foodTemp.name = foodTemp.name.slice(foodTemp.name.indexOf(".") + 1);

        return foodTemp;
      })
    }

  })

  return categoryArr;
}

let propsGroupArr = [];
// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") {
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

async function mkShopDir(shopDir) {
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

async function genExcelAndWord(){
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  let categoryArr = await genMenuFoods();

  let merchantInfo = {
    shopName: shopName,
    shop_pic: "",
    categories:categoryArr
  }


  logInfo(merchantInfo,"merchantRes")
  logInfo(propsGroupArr, "allPropGroups")


  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
  }  else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting, false);
  }else if(exportMode == "feie"){
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

}



genExcelAndWord();

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
const categories = merchantInfo.categories
let categoryObj = {}

let shopName = merchantInfo.store.merchantName;


// 处理规格属性部分
function formatFoodProps(foodDetail) {
  let res = []
  let specs = foodDetail.specs || {};
  if (Object.keys(specs).length != 0) {
    let propGroup = {
      name: specs.title,
      values:[]
    }
    addPropsGroupArr(propsGroupArr,propGroup.name)
    propGroup.values = specs.options && specs.options.map(optionItem => {
      return {
        "value": optionItem.name,
        "price": parseFloat(optionItem.price/100),
        "propName": propGroup.name,
        "isMul": false
      }
    })
    res.push(propGroup)
  }


  let attributes = foodDetail.attributes || [];
  attributes.forEach(attrGroup => {
    // console.log( foodDetail.item.name,attrGroup.title)
    addPropsGroupArr(propsGroupArr, attrGroup.title);
    let propGroupTemp = {
      name: attrGroup.title,
      values:[],
    }
    propGroupTemp.values = attrGroup.options && attrGroup.options.map(optionItem => {
      return {
        "value": optionItem.name,
        "propName": attrGroup.title,
        "isMul": !!attrGroup.multiple,
        "price":0
      }
    })
    res.push(propGroupTemp)
  })

  let materials = foodDetail.materials || [];
  if (materials.length > 0) {
    let feeds = {
      name: "加料",
      values: materials.map(item => {
        return {
          "value": item.name,
          "propName": "加料",
          "isMul": true,
          "price":parseFloat(item.price/100),
        }
      })
    }

    res.push(feeds)
  }





  return res;

}


//读取dataJson下的所有文件取出 food菜品
async function genMenuFoods() { 
  let allFoods = [];
  allFoods.push(...merchantInfo.goods.pages[0]);
  for (let i = 0; i < findJsonLen; i++) { 
    let filePath = path.join(__dirname, "dataJson", "index" + (i==0 ? "" : i));
    let goods = JSON.parse(fs.readFileSync(filePath, "utf-8")).data.goods;
    console.log(goods.length)
    allFoods.push(...goods)
  }
  
  let category = merchantInfo.category, categoryArr = [];

 
  let allFooodsTemp = [];

  for(let i = 0 ; i < allFoods.length-1 ; i++){
    if(allFoods[i].category_id == allFoods[i+1].category_id){
      allFoods[i].items.push(...allFoods[i+1].items);
      allFooodsTemp.push( allFoods[i]);
      i+=1;
    }else{
      allFooodsTemp.push( allFoods[i]);
    }
  }

  // category = category.slice(0,2).concat(...merchantInfo.goods.pages,allFoods[1]) //推荐加前半目录
  // category = category.slice(2);
  // console.log('%ccategory: ','color: MidnightBlue; background: Aquamarine; font-size: 20px;',category);
  allFooodsTemp.forEach(categoryItem => {
    console.log('categoryItem: ', categoryItem);

    let temp = {
      name: categoryItem.name || categoryItem.category_name,
      foods:[]
    }
    categoryItem.items.forEach(record => {
      let foodTemp = {
        name:record.item.name || "",
        picUrl:  record.item.photo_url&&record.item.photo_url.split(",")[0] || defaultImgUrl,
        price:record.item.price/100,
        unit: record.item.unit || "份",
        categoryName:temp.name,
        props:formatFoodProps(record),
      }
      foodTemp.name = foodTemp.name.replace(/\//ig, '-');
      foodTemp.name = foodTemp.name.slice(foodTemp.name.indexOf(".") + 1)
      
      temp.foods.push(foodTemp)
    })
     
    categoryArr.push(temp)
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
  } else if(exportMode == "feie"){
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)
  }

}



genExcelAndWord();

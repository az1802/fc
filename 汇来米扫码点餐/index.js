/*
 * @Author: your name
 * @Date: 2021-03-09 12:20:00
 * @LastEditTime: 2021-07-15 14:21:05
 * @LastEditors: sunj
 * @Description: In User Settings Edit
 * @FilePath: /newCreawling/汇来米扫码点餐/index.js
 */

const fs = require("fs");
const path = require("path");
const requestMenuJson = require("./merchantInfo.json");
const categoryJson = require("./merchantCategory.json");
let merchantMenuInfo = requestMenuJson.respData.goodList;
let goodsList = requestMenuJson.respData.goodsList;
let categoryList = categoryJson.respData.goodsGroupDTOList;

let shopInfo = {
  name: "狐椒粉",
  logo:""
}

const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genFeieExcelAll} = require("../utils/index")


// const exportMode = "keruyun"
const exportMode = "feie"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [
   
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  propsGroupSort: [
    
  ],
  propsSort: {
  }
}



const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync("./"+fileName+".json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  // let requestMenuData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(merchantMenuInfo)
  return merchantInfo;
}

let propsGroupArr=[];



/**
 * {
 * name:"",
 * values:[
 *  {
 *    value: propItem.Name,
      price: propItem.Price,
      propName:groupTemp.name,
      isMul:true
 *  }
 * ]
 * }
 */
function formatFoodProps(foodItem) { 
  let propsRes = [];

  return propsRes;
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestMenuData) {
  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopInfo.name,
      shop_pic: shopInfo.logo,
      categories:[]
    }
    let categoryIdMap = {};
    // 处理菜品目录映射
    categoryList.forEach(item => {
      categoryIdMap[item.groupId] = {
        name: item.groupName,
        foods:[]
      }
    })

    // 菜品目录
    let categories = [];
    goodsList.forEach(goodItem => {
      let categoryId = goodItem.groups[0];
      let categoryObj = categoryIdMap[categoryId];
      if (categoryObj) {
        let foods = categoryObj.foods;
        foods.push({
          name: goodItem.goodsName&&goodItem.goodsName.replace(/\//ig,"-") || "",   
          picUrl: goodItem.goodsLogoUrl || "",
          price:goodItem.goodsPrice || "",
          unit: "份",
          categoryName: categoryObj.name,
          props:[],
        })
      }
    })



    merchantInfo.categories = Object.values(categoryIdMap);
    return merchantInfo;
  } catch (err) { 
    console.log(err, `格式化转换菜品发生错误`)
  }
}

// 数据转换提取,写入相关文件

async function mkShopDir(shopDir) { 
  delDirSync(shopDir);
  mkdirSync(shopDir)
}

// 生成图片文件夹以及excel文件
async function genImgsAndExcel() { 
  let merchantInfo = await getMerchantInfo();
  await logInfo(merchantInfo, "merchantRes")
  await logInfo(propsGroupArr, "propsGroupArr")
  
  // return;
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo,outputDir,menuSetting)
  } else {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir,menuSetting)
    genFeieExcelAll(merchantInfo, outputDir,menuSetting)

  }
}

genImgsAndExcel();

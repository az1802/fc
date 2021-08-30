
const fs = require("fs");
const path = require("path");
const merchantInfo = require("./merchantInfo.json");
let menus = merchantInfo.data.kindMenusVos;
let shopInfo = {
  shopName: "Cut址",
  shopPic: ""
}

const { requestUrl,genImgs,genExcel,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genFeieExcelAll, genShilaiExcelAll} = require("../utils/index")
const outputDir = path.join(__dirname, "merchantInfos")
let propsGroupArr = [];

// const exportMode = "feie";
const exportMode = "shilai"

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice:[
   
  ],//做法
  feeding:[    ],//加料
  remarks: [],//备注
  propsGroupSort:[
  
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}


// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  
  let merchantInfo = await handleRequestData(menus);
  return merchantInfo;
}

function formatFoodProps(foodItem) { 
  let propsRes = []
 
  return propsRes
}
// 爬取的数据中进行信息提取
async function  handleRequestData(menus) {

  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: shopInfo.shopName,
      shop_pic:  shopInfo.shopPic,
      categories:[]
    }

    // 菜品目录
    let categories = []

    categories = menus.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.name;
      categoryData.foods = categoryItem.modules[0].menus[0].items.reduce((res, foodItem) => {
        foodItem.name = foodItem.name.replace(/\//ig, "");
        if (foodItem) { 
          let foodData = {
            name:foodItem.name || "",
            picUrl: foodItem.imagePath || "",
            price:foodItem.price || "",
            unit: foodItem.account || "份",
            categoryName: categoryItem.itemname,
            props:[],
          };
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      },[])
      
      return categoryData
    })

    merchantInfo.categories = categories
    await logInfo(merchantInfo)
    return merchantInfo;
  } catch (err) { 
    console.log(err, `格式化转换菜品发生错误${menus}`)
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
  await logInfo(merchantInfo,"merchantRes")
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  logInfo(propsGroupArr,"allPropGroups")
  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir, menuSetting);
    genExcelAll(merchantInfo, outputDir, menuSetting);
    
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  }
  else {
    // genWord(merchantInfo, outputDir, menuSetting)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }
}



genImgsAndExcel();

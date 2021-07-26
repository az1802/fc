
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genExcelAll,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,genFeieExcelAll,genShilaiExcelAll} = require("../utils/index")




const shopId = "372546e43f394617ba29f2a286ac6576"
const shopRequestUrl = `https://shilai.zhiyi.cn/v2-36/merchant/`
const menuRequestUrl = `https://shilai.zhiyi.cn/v2-36/merchant/dish_catalog/${shopId}?mealType=EAT_IN`


// const exportMode = "keruyun"
// const exportMode = "feie"
const exportMode = "shilai"



let { data:requestShopData} = require("./shopData.json");
let { data:requestMenuData} = require("./menuData.json");
const { isRegExp } = require("util");

const outputDir = path.join(__dirname, "merchantInfos")


// 飞蛾模式 menuSetting
let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications: ["规格"],//规格
  practice: [
    "就餐类型",
  ],//做法
  feeding: ["加料"],
  remarks: [],//备注
  propsGroupSort: [
    "规格", "就餐类型","加料",
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

// 客如云模式 menuSetting
// let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
//   specifications:[],//规格
//   practice:[ '要求', '份量', '口味', '加料', '升级为超值套餐', '加' ],//做法
//   feeding:[],//加料
//   remarks: [],//备注
// }




let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test.json") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  // let requestShopData = await requestUrl(shopRequestUrl);
  // logInfo(requestShopData,"shopData")
  // let requestMenuData = await requestUrl(menuRequestUrl);
  // logInfo(requestShopData, "menuData")

  let merchantInfo = await handleRequestData(requestShopData, requestMenuData)
  await logInfo(merchantInfo, "merchantRes")
  return merchantInfo;
}

// 处理菜品属性
function formatFoodProps(foodItem) { 
  let { propsGroupSort,propsSort } = menuSetting
  
  let propsRes = [], props = foodItem.attrList;
  for (let k = 0; k < props.length; k++) { 
    if (propsGroupArr.indexOf(props[k].groupName)==-1) { 
      propsGroupArr.push(props[k].groupName);
    }

    let propTemp = {
      name: props[k].groupName,
      values: props[k].attrs.map(propValItem => { 
        return {
          value: propValItem.name,
          price: (parseFloat(propValItem.reprice)/100),
          propName: props[k].groupName,
          isMul:true
        }
      })
    }
    propsRes.push(propTemp);
  }

  let supplyCondiments = foodItem.supplyCondiments || [];
  let condimentTemp = {
    name: "加料",
    values: supplyCondiments.map(item => {
      return {
        value: item.name,
        price: (parseFloat(item.marketPrice)/100),
        propName: "加料",
        isMul: true,
        type:"supplyCondiment"
      }
    })
  }
  propsRes.push(condimentTemp)


  return propsRes;
}





// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  // await logInfo(requestMenuData)
  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.name,
      shop_pic: requestShopData.logoUrl,
      categories:[]
    }

    // 菜品目录
    let categories = []

    categories = requestMenuData.dishes.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.category.name;
      categoryData.foods = categoryItem.dishList.reduce((res,foodItem) => { 
        if (foodItem) { 
          let foodData = {
            name:(foodItem.name || ""),
            picUrl: foodItem.image || foodItem.thumbImage || "",
            price:(parseFloat(foodItem.price)/100) || "",
            unit: foodItem.unit || "份",
            categoryName:  categoryItem.category.name,
            props:[],
          };
          let arrTemp = ["酸菜干拌","牛腩干拌"]
          // if (foodData.picUrl.indexOf('jpg')==-1){
          //   foodData.picUrl=""
          // }


          foodData.name =   foodData.name.trim().replace(/\//ig,"-")
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      },[])
      
      return categoryData
    })


    merchantInfo.categories = categories
    return merchantInfo;
  } catch (err) { 
    console.log(err, `格式化转换菜品发生错误${menuRequestUrl}`)
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

  logInfo(propsGroupArr,"propsGroupArr")
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'feie') {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting)
  } else {
    console.error("未设置导出模式")
  }

}



genImgsAndExcel();

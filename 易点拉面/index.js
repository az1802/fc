
const fs = require("fs");
const path = require("path");


const { requestUrl,genImgs,genExcel,genWord,genSpecificationsWord,formatFileName,delDirSync,mkdirSync,addPropsGroupArr,genExcelAll,genFeieExcelAll} = require("../utils/index")




const shopId =1000573
// const shopId = 1001500
// const exportMode = "keruyun"
const exportMode = "feie"
const shopRequestUrl = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`
const menuRequestUrl = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_getProductDetail.action?shop_id=${shopId}`


let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications:[],//规格
  practice: [
    "打包",
    "小吃",
    "饮料"
  ],//做法
  feeding:[    ],//加料
  remarks: [],//备注
  propsGroupSort: [
    "打包",
    "小吃",
    "饮料"
  ],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  }
}

const attrsSort = [

]



const outputDir = path.join(__dirname, "merchantInfos")
let propsGroupArr = [];

// 打印日志到test.json 文件夹
async function logInfo(info,fileName="test") { 
  fs.writeFileSync(`./${fileName}.json`,JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { 
  let requestShopData = await requestUrl(shopRequestUrl);
  let requestMenuData = await requestUrl(menuRequestUrl);
  let merchantInfo = await handleRequestData(requestShopData,requestMenuData)
  return merchantInfo;
}

function formatFoodProps(foodItem) { 
  let propsPrice = foodItem.prop_prices,propsPriceObj = {};
  for (let j = 0; j < propsPrice.length; j++){ 
    propsPriceObj[propsPrice[j].keys] = propsPrice[j].price
  }
  
  let propsRes = [],props = foodItem.props;
  for (let k = 0; k < props.length; k++) {
    addPropsGroupArr(propsGroupArr,props[k].p_name)
    propsRes.push({
      name: props[k].p_name,
      values: props[k].values.map(propValItem => { 
        return {
          value: propValItem.p_value,
          price: propsPriceObj[`#${props[k].p_name_id}_${propValItem.p_value_id}#`],
          propName: props[k].p_name,
          type: "",
          isMul:props[k].is_multiple
        }
      })
    })
  }

  
  return propsRes
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {

  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.sname,
      shop_pic: requestShopData.pic_url,
      categories:[]
    }

    // 菜品目录
    let categories = []

    categories = requestMenuData.detail.items.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.itemname;
      categoryData.foods = categoryItem.products.reduce((res,foodItem) => { 
        if (foodItem) { 
          let foodData = {
            name:foodItem.name || "",
            picUrl: foodItem.big_pic || foodItem.small_pic || "",
            price:foodItem.curr_price || "",
            unit: foodItem.unit || "份",
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
    
  } else {
    // genWord(merchantInfo, outputDir, menuSetting)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }
}



genImgsAndExcel();

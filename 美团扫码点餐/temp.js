
const fs = require("fs");
const path = require("path");
let foodsJson = require("./tempJson/foods.json")
let shopInfo = require("./tempJson/shopInfo.json")


const { requestUrl,genImgs,genExcel,genWord,formatFileName,delDirSync,mkdirSync} = require("../utils/index")




const shopId = 1000175
const exportMode = "keruyun"
// const exportMode = "feie"
const shopRequestUrl = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`
const menuRequestUrl = `https://m.huanxiongdd.com/dd_wx_applet/sitdownrts/ajax_getProductDetail.action?shop_id=${shopId}`


const outputDir = path.join(__dirname, "merchantInfos")


// 打印日志到test.json 文件夹
async function logInfo(info) { 
  fs.writeFileSync("./test.json",JSON.stringify(info,null,'\t'))
}

// 获取原始数据
async function getMerchantInfo() { create

  let requestShopData = shopInfo.value
  let requestMenuData = foodsJson.value;
  let merchantInfo = await handleRequestData(requestShopData,requestMenuData)
  return merchantInfo;
}

function formatFoodProps(foodItem) { 
  let propsPrice = foodItem.prop_prices,propsPriceObj = {};
  for (let j = 0; j < propsPrice.length; j++){ 
    propsPriceObj[propsPrice[j].keys] = propsPrice[j].price
  }
  
  let propsRes = [],props = foodItem.props;
  for (let k = 0; k < props.length;k++) { 
    propsRes.push({
      name: props[k].p_name,
      values: props[k].values.map(propValItem => { 
        return {
          value: propValItem.p_value,
          price: propsPriceObj[`#${props[k].p_name_id}_${propValItem.p_value_id}#`],
          propName: props[k].p_name,
          isMul:props[k].is_multiple
        }
      })
    })
  }
  return propsRes
}
// 爬取的数据中进行信息提取
async function  handleRequestData(requestShopData,requestMenuData) {
  // await logInfo(requestMenuData)
  
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.shopInfo.shopName,
      shop_pic: "",
      categories:[]
    }

    // 菜品目录
    let categories = []

    categories = requestShopData.dishCategories.map(categoryItem => { 
      let categoryData = {
        name: "",
        foods:[]
      };
      categoryData.name = categoryItem.categoryName;
      categoryData.foods = categoryItem.spuIds.reduce((res, supId) => { 
        let foodItem = requestMenuData[supId]
        if (foodItem) { 
          let foodData = {
            name:foodItem.spuName || "",
            picUrl: foodItem.picUrls[0] ||  "",
            price:foodItem.currentPrice || "",
            unit: foodItem.unit || "份",
            categoryName: categoryItem.categoryName,
            props:[],
          };

          // TODO 菜品属性待确定
          // foodData.props = formatFoodProps(foodItem) 

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
  await logInfo(merchantInfo)
  let { shopName} = merchantInfo
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)


  // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo,outputDir);
    genExcel(merchantInfo, outputDir);
  } else {
    
    genWord(merchantInfo, outputDir)
  }

  

}



genImgsAndExcel();


const fs = require("fs");
const path = require("path");

const { requestUrl, genImgs, genExcel, genExcelAll, genWord, genSpecificationsWord, formatFileName, delDirSync, mkdirSync, genFeieExcelAll, genShilaiExcelAll } = require("../utils/index")

const shopId = 38620
// const exportMode = "keruyun"
const exportMode = "feie"
// const exportMode = "shilai"
const shopRequestUrl = `https://m.diandianwaimai.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`
const menuRequestUrl = `https://m.diandianwaimai.com/dd_wx_applet/sitdownrts/ajax_getProductDetail.action?shop_id=${shopId}`

// const shopRequestUrl = `https://m.diandianwaimai.com/dd_wx_applet/sitdownrts/getShopInfo?shop_id=${shopId}`
// const menuRequestUrl = `https://m.diandianwaimai.com/dd_wx_applet/sitdownrts/ajax_getProductDetail.action?shop_id=${shopId}`

// let requestShopData = require("./shopData.json");
// let requestMenuData = require("./menuData.json");
const { isRegExp } = require("util");




const outputDir = path.join(__dirname, "merchantInfos")

let menuSetting = { //到处的菜品属性归为规格,备注,加料,做法
  specifications: [],//规格
  practice: [
    "打包"
  ],//做法
  feeding: ["加料"],//加料
  remarks: [],//备注
  propsGroupSort: [
    "打包"
  ],
  propsSort: {
  }
}


let propsGroupArr = [];


// 打印日志到test.json 文件夹
async function logInfo(info, fileName = "test.json") {
  fs.writeFileSync(`./${fileName}.json`, JSON.stringify(info, null, '\t'))
}

// 获取原始数据
async function getMerchantInfo() {
  let requestShopData = await requestUrl(shopRequestUrl);
  logInfo(requestShopData, "shopData")
  let requestMenuData = await requestUrl(menuRequestUrl);
  logInfo(requestMenuData, "menuData")
  let merchantInfo = await handleRequestData(requestShopData, requestMenuData)
  await logInfo(merchantInfo, "merchantRes")
  return merchantInfo;
}

function formatFoodProps(foodItem) {
  let { propsGroupSort, propsSort } = menuSetting
  let propsPrice = foodItem.prop_prices, propsPriceObj = {};

  for (let j = 0; j < propsPrice.length; j++) {
    propsPriceObj[propsPrice[j].keys] = propsPrice[j].price
  }

  let propsRes = [], props = foodItem.props;
  for (let k = 0; k < props.length; k++) {
    if (propsGroupArr.indexOf(props[k].p_name) == -1) {
      propsGroupArr.push(props[k].p_name);
    }

    let propTemp = {
      name: props[k].p_name,
      values: props[k].values.map(propValItem => {
        return {
          value: propValItem.p_value,
          price: propsPriceObj[`#${props[k].p_name_id}_${propValItem.p_value_id}#`],
          propName: props[k].p_name,
          isMul: props[k].is_multiple
        }
      })
    }


    // if (propsSort[propTemp.name]) { //具体某个属性的排序
    //   let propNameSort = propsSort[propTemp.name]
    //   let tempPropsSort = new Array(propNameSort.length)
    //   let propValues = propTemp.values
    //   for (let i = 0; i < propValues.length;i++) { 
    //     let propIndex = propNameSort.indexOf(propValues[i].value);
    //     if (propIndex == -1) {
    //       console.log(propNameSort,propValues[i])
    //       console.error(`${propTemp.name}属性排序错误`)
    //     } else { 
    //       tempPropsSort[propIndex] = propValues[i];
    //     }
    //   }
    //   tempPropsSort = tempPropsSort.filter(item => !!item);
    //   propTemp.values = tempPropsSort
    // }

    propsRes.push(propTemp);
  }


  logInfo(propsGroupArr, "./propGroups.txt")
  //处理属性组的顺序  


  // let tempPropsGroup = new Array(propsGroupSort.length)
  // for (let i = 0; i < propsRes.length;i++) { 
  //   let groupIndex = propsGroupSort.indexOf(propsRes[i].name);
  //   // console.log("groupIndex---",groupIndex)
  //   if (groupIndex == -1) {
  //     console.error(`${propsRes[i].name}不在所有的属性组中`)
  //   } else { 
  //     tempPropsGroup[groupIndex] = propsRes[i];
  //   }
  // }
  // tempPropsGroup = tempPropsGroup.filter(item => { 
  //   return !!item
  // })

  return propsRes
}





// 爬取的数据中进行信息提取
async function handleRequestData(requestShopData, requestMenuData) {
  // await logInfo(requestMenuData)

  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.sname,
      shop_pic: requestShopData.pic_url,
      categories: []
    }

    // 菜品目录
    let categories = []

    categories = requestMenuData.detail.items.map(categoryItem => {
      let categoryData = {
        name: "",
        foods: []
      };
      categoryData.name = categoryItem.itemname;
      categoryData.foods = categoryItem.products.reduce((res, foodItem) => {
        if (foodItem) {
          let foodData = {
            name: foodItem.name.replace(/\//ig, "-") || "",
            picUrl: foodItem.big_pic || foodItem.small_pic || "",
            price: foodItem.curr_price || "",
            unit: foodItem.unit || "份",
            categoryName: categoryItem.itemname,
            props: [],
          };
          foodData.props = formatFoodProps(foodItem)
          res.push(foodData)
        }
        return res;
      }, [])

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
  console.log('%cmerchantInfo: ', 'color: MidnightBlue; background: Aquamarine; font-size: 20px;', merchantInfo);
  let { shopName } = merchantInfo
  console.log('%cshopName: ', 'color: MidnightBlue; background: Aquamarine; font-size: 20px;', shopName);
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir)

  // // // mkShopDir(merchantInfo)
  if (exportMode == "keruyun") {
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo, outputDir, menuSetting)
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting, false)
  } else {
    // genWord(merchantInfo, outputDir)
    // genSpecificationsWord(merchantInfo, outputDir, menuSetting)
    genFeieExcelAll(merchantInfo, outputDir, menuSetting)
  }

}



genImgsAndExcel();

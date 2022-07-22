const fs = require('fs');
const path = require('path');

const {
  requestUrl,
  genImgs,
  genExcel,
  genExcelAll,
  genWord,
  genSpecificationsWord,
  formatFileName,
  delDirSync,
  mkdirSync,
  genShilaiExcelAll,
  genFeieExcelAll,
} = require('../utils/index');

// const exportMode = "keruyun"
const exportMode = 'feie';

// const exportMode = 'shilai';

let allMerchantInfo = require('./merchantInfo.json');
let otherDishInfo = require('./otherDishInfo.json');

let allCategoryData =
  allMerchantInfo.data.data.components[2].data.dishMenu.data.dishCates;
// console.log('%ccategoryData: ','color: MidnightBlue; background: Aquamarine; font-size: 20px;',allCategoryData);
let allDishes =
  allMerchantInfo.data.data.components[2].data.dishMenu.data.spuInfos;
let otherDishes = otherDishInfo.data.data || [];
allDishes = {
  ...allDishes,
  ...otherDishes,
};

// console.log('%callDishes: ','color: MidnightBlue; background: Aquamarine; font-size: 20px;',allDishes);
let requestShopData = {
  name: '煲掌柜',
  picUrl: '',
};

const outputDir = path.join(__dirname, 'merchantInfos');

let menuSetting = {
  //到处的菜品属性归为规格,备注,加料,做法
  specifications: [], //规格
  practice: ['规格', '备注', '打包', '默认'], //做法
  feeding: [], //加料
  remarks: [], //备注
  propsGroupSort: ['规格', '备注', '打包', '默认'],
  propsSort: {
    // "口味":["不辣","微辣","中辣","特辣","麻辣"]
  },
};

let propsGroupArr = ['备注'];

// 打印日志到test.json 文件夹
async function logInfo(info, fileName = 'test.json') {
  fs.writeFileSync(`./${fileName}.json`, JSON.stringify(info, null, '\t'));
}

// 获取原始数据
async function getMerchantInfo() {
  let merchantInfo = await handleRequestData();
  return merchantInfo;
}

function addPropsGroupArr(propsGroupArr, name) {
  if (propsGroupArr.indexOf(name) == -1) {
    propsGroupArr.push(name);
  }
}

function formatFoodProps(foodItem) {
  let propsRes = [];

  let cookbookDishSku = foodItem.cookbookDishSkuList[0];
  if (!cookbookDishSku) {
    return [];
  }

  if (foodItem.cookbookDishSkuList.length > 1) {
    propsRes.push({
      name: '规格',
      values:
        foodItem.cookbookDishSkuList.map((item) => {
          return {
            value: item.skuName,
            price:
              parseFloat(item.sellPrice - cookbookDishSku.sellPrice || 0) / 100,
            propName: '规格',
            isMul: false,
          };
        }) || [],
    });
  }

  let {
    practiceGroups = [],
    sideDishGroups = [],
    remarks = [],
  } = cookbookDishSku;

  practiceGroups.forEach((groupItem) => {
    addPropsGroupArr(propsGroupArr, groupItem.groupName);
    propsRes.push({
      name: groupItem.groupName,
      values:
        (groupItem.dishProperties &&
          groupItem.dishProperties.map((specItem) => {
            return {
              value: specItem.name,
              price: parseFloat(specItem.addPrice || 0) / 100,
              propName: groupItem.groupName,
              isMul: true,
            };
          })) ||
        [],
    });
  });

  sideDishGroups.forEach((sideDishGroupItem, index) => {
    addPropsGroupArr(propsGroupArr, sideDishGroupItem.groupName);
    propsRes.push({
      name: sideDishGroupItem.groupName,
      values:
        (sideDishGroupItem.sideDishes &&
          sideDishGroupItem.sideDishes.map((sideDishItem) => {
            return {
              value: sideDishItem.name,
              price: parseFloat(sideDishItem.addPrice || 0) / 100,
              propName: sideDishGroupItem.groupName,
              isMul: true,
            };
          })) ||
        [],
    });
  });

  if (remarks.length) {
    propsRes.push({
      name: '备注',
      values:
        remarks.map((remarkItem) => {
          return {
            value: remarkItem.name,
            price: parseFloat(remarkItem.addPrice || 0) / 100,
            propName: '备注',
            isMul: true,
          };
        }) || [],
    });
  }

  return propsRes;
}

// 爬取的数据中进行信息提取
async function handleRequestData() {
  try {
    // 商户信息
    let merchantInfo = {
      shopName: requestShopData.name,
      shop_pic: requestShopData.picUrl,
      categories: [],
    };

    // 菜品目录
    let categories = [];
    categories = allCategoryData.map((categoryItem) => {
      let categoryData = {
        name: categoryItem.name,
        foods: [],
      };
      categoryData.foods = categoryItem.spuIds.reduce((res, supId) => {
        let foodItem = allDishes[supId];
        if (foodItem) {
          let cookbookDishSku = foodItem.cookbookDishSkuList[0];
          let foodData = {
            name: foodItem.dishName.replace(/\//gi, '-') || '',
            picUrl:
              (cookbookDishSku && cookbookDishSku.skuImgUrl) ||
              (cookbookDishSku &&
                cookbookDishSku.skuImageList &&
                cookbookDishSku.skuImages[0]) ||
              '',
            price: parseFloat(foodItem.sellPrice) / 100 || '',
            unit: foodItem.overPlusUnitName || '份',
            categoryName: categoryData.name,
            props: [],
          };
          // console.log(`${foodData.name}---${foodData.picUrl}`)

          foodData.props = formatFoodProps(foodItem);
          // foodData.props = []
          res.push(foodData);
        }
        return res;
      }, []);

      return categoryData;
    });

    merchantInfo.categories = categories;
    return merchantInfo;
  } catch (err) {
    console.log(err, `格式化转换菜品发生错误`);
  }
}

// 数据转换提取,写入相关文件

async function mkShopDir(shopDir) {
  delDirSync(shopDir);
  mkdirSync(shopDir);
}

// 生成图片文件夹以及excel文件
async function genImgsAndExcel() {
  let merchantInfo = await getMerchantInfo();
  await logInfo(merchantInfo, 'merchantRes');
  await logInfo(propsGroupArr, 'propsGroupArr');
  let { shopName } = merchantInfo;
  // console.log(merchantInfo)
  let shopDir = path.join(outputDir, formatFileName(shopName));
  // // 重建创建商铺目录
  await mkShopDir(shopDir);

  // // // mkShopDir(merchantInfo)
  if (exportMode == 'keruyun') {
    genImgs(merchantInfo, outputDir);
    genExcel(merchantInfo, outputDir);
    genExcelAll(merchantInfo, outputDir, menuSetting);
  } else if (exportMode == 'shilai') {
    genShilaiExcelAll(merchantInfo, outputDir, menuSetting);
  } else if (exportMode == 'feie') {
    genFeieExcelAll(merchantInfo, outputDir, menuSetting);
  } else {
    genWord(merchantInfo, outputDir);
    genSpecificationsWord(merchantInfo, outputDir, menuSetting);
  }
}

genImgsAndExcel();

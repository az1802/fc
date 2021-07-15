let foodsJson = require("./foods.json")
let shopInfo = require("./shopInfo.json")
let foods = foodsJson.value
const fs = require("fs")
const path = require("path");
const request = require('request')
const { getFiles, getFileJson, genExcel, getDetail } = require("../utils/index")


console.log(shopInfo.value.dishCategories)

let shopName = shopInfo.value.shopInfo.shopName;
let dirname = path.join(__dirname,shopName);
let dishCategories = shopInfo.value.dishCategories;

let dishes = [];


async function handleDish(dishCategories) { 
  dishCategories.forEach(cateforyItem => { 
    let menuTemp = {
      menuName: "",
      foods:[]
    }
    let mainCategoryName = cateforyItem.categoryName;
    if (cateforyItem.childDishCategories && cateforyItem.childDishCategories.length > 0) {
      cateforyItem.childDishCategories.forEach(childCateforyItem => { 
        let menuTemp = {
          menuName: mainCategoryName+childCateforyItem.categoryName,
          foods:[]
        }

        childCateforyItem.spuIds.forEach(supid => { 
          let foodItem = foods[supid]
          if (foodItem) { 
            let foodTemp = {
              name: foodItem.spuName,
              big_pic: foodItem.detailPicUrls&&foodItem.detailPicUrls[0],
              small_pic: foodItem.picUrls&&foodItem.picUrls[0],
              unit: foodItem.unit,
              menuName: menuTemp.menuName,
              price:foodItem.currentPrice
            }
            menuTemp.foods.push(foodTemp)
          }
        })

        dishes.push(menuTemp)
      })
    } else { 
      menuTemp.menuName = cateforyItem.categoryName
      cateforyItem.spuIds.forEach(supid => { 
        let foodItem = foods[supid]
        if (foodItem) { 
          let foodTemp = {
            name: foodItem.spuName,
            big_pic: foodItem.detailPicUrls&&foodItem.detailPicUrls[0],
            small_pic: foodItem.picUrls&&foodItem.picUrls[0],
            unit: foodItem.unit,
            menuName: menuTemp.menuName,
            price:foodItem.currentPrice
          }
          menuTemp.foods.push(foodTemp)
        }
      })
      dishes.push(menuTemp)
    }
  })
}


async function genImgs() { 
  
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname);
  }

  dishes.forEach(menuItem => { 
    let menuDir = path.join(dirname, menuItem.menuName)
    if(!fs.existsSync(menuDir)) { 
      fs.mkdirSync(menuDir);
    }
    let foods = menuItem.foods
    foods.forEach(foodItem => {
      let imgUrl = foodItem.big_pic || foodItem.small_pic;
      let imgName = foodItem.name + ".jpg"
      if (foodItem.big_pic || foodItem.small_pic ) { 
        request(foodItem.big_pic || foodItem.small_pic).pipe(fs.createWriteStream(path.join(menuDir,imgName)))
      }
    })
  })



}


async function handle() { 
  await handleDish(dishCategories);

  await genImgs();

  let excelData = [];
  let title = ["商品名称","一级分类","二级分类","标准单位","品牌定价"];
  excelData.push()
  dishes.forEach(menuItem => { 
    menuItem.foods.forEach(foodItem => { 
      excelData.push([foodItem.name,"默认",foodItem.menuName,foodItem.unit,parseFloat(foodItem.price).toFixed(2)])
    })
  })

  await genExcel({title,data:excelData,excelPath:`./${shopName}-客如云菜品导入.xlsx`})

}



handle();

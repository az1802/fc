const fs = require('fs');
var path = require("path");
const request = require('request')
const { resolve } = path;

async function sleep() {
  return new Promise((resolve, reject) => {
    setTimeout(resolve,3000)
  })
}

// 格式化文件名称
function formatFileName(name="") {
  return name.replace(/\//ig, "-")
}


function mkdirSync(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}


function genExportDirs(outputDir, shopName) {
  let shopDir = path.join(outputDir, formatFileName(shopName));
  let foodsImgsDir = path.join(shopDir, "imgs");
  mkdirSync(shopDir)
  mkdirSync(foodsImgsDir);

  return {
    shopDir,
    foodsImgsDir
  }
}

// ext 表示爬取图片之后 图片的后缀名
function genImgs(categories, { shopDir, ext = 'jpg' }) {
  categories.forEach(async categoryItem => {
    if (!categoryItem) {
      return;
    }
    categoryItem.foods.forEach(async foodItem => {

      let url = foodItem.picUrl
      let imgName = foodItem.name
      if (url) {
        if (typeof ext == 'fucntion ') {
          ext = ext(url)
        } else {
          ext = ext || url.slice(url.lastIndexOf("."));
        }
        try {
      console.log('%curl: ','color: MidnightBlue; background: Aquamarine; font-size: 20px;',url);

          await request(encodeURI(url)).pipe(fs.createWriteStream(path.join(shopDir, "imgs", `${imgName}.${ext}`)));
          await sleep(3000)
        } catch (err) {
          console.log(`保存图片错误${imgName}`)
        }
      }
    })
  })
}

async function genImgs2(merchantInfo,outputDir) { 
  let { categories, shopName, shop_pic } = merchantInfo;
  let shopDir = path.join(outputDir, formatFileName(shopName));
  let foodsImgsDir = path.join(shopDir, "imgs");
  let noImgUrls = []
  // mkdirSync(foodsImgsDir)
  // 生成菜品图片文件夹 
  categories.forEach((categoryItem) => { 
    let categoryDir = foodsImgsDir;

    let foods = categoryItem.foods
    foods.forEach(foodItem => {
      let imgUrl = foodItem.picUrl;
      let imgName = formatFileName(foodItem.name) + ".jpg"
      if (imgUrl) {
        try {
          request(imgUrl).pipe(fs.createWriteStream(path.join(categoryDir, imgName.trim())))
          
        } catch (err) { 
          noImgUrls.push(imgName)
          console.log(imgName,"下载错误")
        }
      } else { 
        noImgUrls.push(imgName)
      }
    })
  })
  fs.writeFileSync(path.join(shopDir, "没有成功爬取的图片.txt"),"没有成功爬取的图片:"+noImgUrls.join(","))
}


/*
menuSetting = {
  specifications:[ "规格"],//规格
  practice: [   //做法
    "加料",
    "口味",
    "做法",
    "打包"
  ],//做法
  feeding:[],//加料
  remarks: [],//备注
  packs:[],//打包
  propsGroupSort: [
    "加料",
    "规格",
    "口味",
    "做法",
    "打包"
  ],
  propsSort: {
  }
}
**/



function unique(arr, name) {
  let hash = {};
  return arr.reduce(function (item, next) {
    hash[next[name]] ? '' : hash[next[name]] = true && item.push(next);
    return item;
  }, []);
}

function cloneDeep(value){
  let memo = {};
  function baseClone(value){
    let res;
    if(isPrimitive(value)){
      return value;
    }else if(Array.isArray(value)){
      res = [...value];
    }else if(isObject(value)){
      res = {...value};
    }
    Reflect.ownKeys(res).forEach(key=>{
      if(typeof res[key] === "object" && res[key]!== null){
        if(memo[res[key]]){
          res[key] = memo[res[key]];
        }else{
          memo[res[key]] = res[key];
          res[key] = baseClone(res[key])
        }
      }
    })
    return res;  
  }
  return baseClone(value)
}

function adjustAttrGroupSort(foodItem, propsGroupSort) {
  let tempArr = new Array(propsGroupSort.length);
  let { props: attrGroups } = foodItem;
  attrGroups.forEach(groupItem => {
    let groupIndex = propsGroupSort.indexOf(groupItem.name);
    if (groupIndex == -1) {
      console.error(`${groupItem.name}不在所有的属性组中---${foodItem.name}`)
    } else {
      tempArr[groupIndex] = groupItem
    }
  })
  tempArr = tempArr.filter(item => !!item);

  foodItem.props = tempArr;
}

function adjustAttrSort(foodItem, propsGroupSort, propsSort) {
  // 调整属性组内属性的具体顺序
  let { props: attrGroups } = foodItem;
  attrGroups.forEach(groupItem => {
    let { name: groupName, values: attrs } = groupItem;
    let groupSortSetting = propsSort[groupName]
    if (groupSortSetting) { //存在此属性组排序调整的设置
      let tempArr = new Array(groupSortSetting.length);
      attrs.forEach(attrItem => {
        let sortIndex = groupSortSetting.indexOf(attrItem.value)
        if (sortIndex == -1) {
          console.error(`${groupName}属性排序错误`)
        } else {
          tempArr[sortIndex] = attrItem;
        }

      })
      tempArr = tempArr.filter(item => !!item);
      groupItem.values = tempArr;
    }
  })

}


// 处理菜品的属性,调整顺序等操作
async function handleFoodAttrs(foodItem, menuSetting = menuSettingDefault) {


  let { propsGroupSort, propsSort, specifications, practice, feeding, packs=[] } = menuSetting //提取属性组合属性的顺序
  let props = foodItem.props;


  //先对菜品属性的顺序进行调整
  adjustAttrGroupSort(foodItem, propsGroupSort)
  adjustAttrSort(foodItem, propsGroupSort, propsSort)

  Object.assign(foodItem, {
    skus: [],
    attrGroups: [],
    specs: [],
    packs: []
  })

  //配置分类出规格,加料,属性,打包盒等内容
  foodItem.props.forEach(groupItem => {
    if (specifications.indexOf(groupItem.name) !== -1) { //规格
      foodItem.skus.push(groupItem);
    } else if (practice.indexOf(groupItem.name) !== -1) {//做法
      foodItem.attrGroups.push(groupItem)
    } else if (feeding.indexOf(groupItem.name) !== -1) {//加料
      foodItem.specs.push(groupItem)
    } else if (packs.indexOf(groupItem.name) !== -1) {//打包
      foodItem.packs.push(groupItem)
    } else {
      console.error(`${groupItem.name}未在设置中进行配置`)
    }
  })
}


module.exports = {
  unique,
  cloneDeep,
  formatFileName,
  mkdirSync,
  genExportDirs,
  genImgs,
  genImgs2,
  adjustAttrGroupSort,
  adjustAttrSort,
  handleFoodAttrs
}

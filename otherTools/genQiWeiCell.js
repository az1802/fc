let xlsx = require('node-xlsx');
const fs = require('fs')
const path = require('path')

// 解析得到文档中的所有 sheet
let sheets = xlsx.parse(fs.readFileSync(path.join(__dirname, 'plugids.xlsx')));

// 遍历 sheet
sheets.forEach(function (sheet) {
  let arr = []
  let keys = [];
  // 遍历xlsx每行内容
  for (let rowId in sheet['data']) {
    let temp = {};
    let row = sheet['data'][rowId];
    if (rowId == 0) {
      keys = row;
    } else {
      for (let i = 0; i < row.length; i++) {
        temp[keys[i]] = row[i];
      }
      arr.push(temp)
      
    }
  }
  let str = "";
  arr.forEach(item => {
    if (item["商家ID"] && item["群聊ID"]) {
      str += `\n    <cell
        v-else-if="merchantId == '${item["商家ID"]}'"
        plugid="${item["群聊ID"]}"
        bind:startmessage="startmessage"
        bind:completemessage="completemessage"
      />    `
    }
  });
  fs.writeFile(`${sheet.name}.text`, str, res => {
    console.log('write success');
  })
});
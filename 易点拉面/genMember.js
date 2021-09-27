const fs = require("fs");
const path = require("path");
let { accounts } = require('./member.json')
let str = "";

accounts.forEach(item => {
  if (item.balance!=0) {
  str+=`${item.mobile} 余额:${item.balance}\n`
    
  }
})

fs.writeFileSync(path.resolve(__dirname,"members.txt"),str)

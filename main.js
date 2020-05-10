const view = {

  displayFields() { // 顯示地雷版圖
    const mineMap = document.getElementById('mineMap')
    let htmlContent = "";
    let mines = ""
    //let line = `<div class="w-100"></div>`

    model.fields.forEach(field => {
      mines += `<button type="button" class='mine' id="${field.position}" data-index="${field.index}"></button>`
      if ((field.position).split("-")[1] === "8") {
        let eachRow = `<div class="eachRow">${mines}</div>`
        //eachRow.innerHTML = mines;
        htmlContent += eachRow;
        mines = "";
      }
    })

    mineMap.innerHTML = htmlContent;
  },
  displayFlagNum() { //從model拿資料，顯示旗子數量在畫面上
    const flag = document.getElementById('flagNum');
    flag.innerHTML = model.numOfFlag;
  },

  showFieldContent(field) { //更改單一格子的內容，像是顯示數字、地雷，或是海洋。
    let pos = field.position;
    let eachButton = document.getElementById(pos);
    if (field.type === "space") {
      if (field.minesAround === 0) {
        eachButton.classList.add('clicked')

      } else {
        eachButton.innerHTML = `<p>${field.minesAround}</p>`
        eachButton.classList.add('disabled')
      }
    } else {
      eachButton.innerHTML = `<i class="fas fa-bomb"></i>`
      eachButton.classList.add('disabled')
    }

  },
  showFlag() { // 將所有炸彈用旗子取代
    model.fields.forEach(f => {
      let pos = f.position;
      let eachButton = document.getElementById(pos);
      if (f.type === "mine") {
        eachButton.innerHTML = `<i class="fas fa-flag"></i>`;
      }
    })
    model.numOfFlag = 0;
    this.displayFlagNum();
  },
  markFlag(fieldBtn) { //放置旗子的function
    //從model.numOfFlag確認旗子數量
    if (model.numOfFlag > 0) {
      // 確認該按鈕在：1. 沒被放旗子 2.沒被按過
      if (!fieldBtn.classList.contains('flag') &&
        !fieldBtn.classList.contains('disabled') &&
        !fieldBtn.classList.contains('clicked')) {
        console.log('markFlag!');
        fieldBtn.innerHTML = `<i class="fas fa-flag"></i>`;
        fieldBtn.classList.add('flag');
        model.numOfFlag--;
        this.displayFlagNum();
      }
      else if (fieldBtn.classList.contains('flag')) {
        console.log('removeFlag!');
        fieldBtn.innerHTML = ``;
        fieldBtn.classList.remove('flag');
        model.numOfFlag++;
        this.displayFlagNum();
      }

    }
  },
  renderTime() { //顯示經過的遊戲時間在畫面上
    let timer = document.getElementById('timer')
    timer.innerHTML = parseInt(timer.innerHTML) + 1
    gameTimer = setTimeout("view.renderTime()", 1000)
  },
  showBoard() { //遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來
    model.fields.forEach(f => {
      if (f.type === "mine") {
        view.showFieldContent(f);
      }
      //view.showFieldContent(f);
    })

  },
  buttonDisable() { //遊戲結束時，鎖定所有按鈕
    const buttons = document.querySelectorAll('.mine')
    buttons.forEach(b => { b.disabled = true });
  }
}

const controller = {
  /**
   * createGame()
   * 根據參數決定遊戲版圖的行列數，以及地雷的數量，
   * 一定要做的事情有：
   *   1. 顯示遊戲畫面
   *   2. 遊戲計時
   *   3. 埋地雷
   *   4. 綁定事件監聽器到格子上
   */
  createGame(numberOfRows, numberOfMines) {

    // 0. 設置資料到model 中，後續view資料來源都從model來
    model.fieldsNum = numberOfRows * numberOfRows;
    model.rowNum = numberOfRows;
    model.numOfFlag = numberOfMines;
    this.setMinesAndFields(numberOfMines);//取得地雷的index，存進model

    for (let i = 0; i < model.fieldsNum; i++) { //
      let field = {
        position: "",
        type: "number",
        index: 0,
        minesAround: 0,
        isDigged: false,
      };
      let rowNum = parseInt(i / numberOfRows);
      let colNum = i % numberOfRows;
      field.position = rowNum + "-" + colNum;
      field.type = model.isMine(i) ? "mine" : "space";
      field.index = i
      //console.log(field.position);
      //console.log(field.type);
      model.fields.push(field);
    }
    //console.log(model.fields);

    // 1. 埋地雷，改變每個格子的資料
    this.getFieldData();

    // 2. 依據model顯示畫面
    view.displayFields();
    view.displayFlagNum();

    // 3. 綁定事件監聽器到格子上
    const mineMap = document.getElementById('mineMap');
    // 3.1 左鍵事件
    mineMap.addEventListener('click', e => {
      if (event.target.classList.contains('mine')) {
        //console.log(e);
        //console.log(event.target.type);
        let field = model.fields[parseInt(event.target.dataset.index)]
        controller.dig(field);
        if (model.clickTimes === 0) {
          view.renderTime();
          model.clickTimes++;
        }

      }
    })
    // 3.2 右鍵事件
    mineMap.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (event.target.classList.contains('mine')) {
        if (model.clickTimes > 0) {
          view.markFlag(event.target);
        }

      }
    })
  },
  setMinesAndFields(numberOfMines) { //設定格子的內容，以及產生地雷的編號
    model.mines = utility.getRandomNumberArray(model.fieldsNum).slice(0, numberOfMines);
    //console.log(model.mines)
  },
  getFieldData() { //取得單一格子的內容，計算周邊的地雷數量
    const mines = model.mines
    mines.forEach(mine => {
      let minePosition = model.fields[mine].position
      let row = parseInt(minePosition.split("-")[0])
      let col = parseInt(minePosition.split("-")[1])
      console.log("mine:(", row, ",", col, ")")
      for (let i = row - 1; i < row + 2; i++) {
        if (i < 0 || i > model.rowNum - 1) { continue }

        for (let j = col - 1; j < col + 2; j++) {
          if (j < 0 || j > model.rowNum - 1) { continue }

          let pos = i + "-" + j;
          let field = model.fields.find(f => f.position === pos);
          let fieldIndex = model.fields.indexOf(f => f.position === pos);
          if (field.type === "space") {
            field.minesAround++;
          }
          //console.log(field);
          model.fields[fieldIndex] = field;
        }
      }

    })

  },
  dig(field) { // 遞迴函式：根據挖下的格子內容不同，執行不同的動作

    // 判斷該位置是數字是否為零，是者展開遞迴
    if (field.type === "space") {
      if (field.minesAround === 0) {
        view.showFieldContent(field)
        field.isDigged = true;
        model.numOfFlipedField++;
        console.log(model.numOfFlipedField);
        this.GameFinish();
        // if (this.GameFinish()) {
        //   alert("You Win!")
        //   view.showBoard();
        //   view.showFlag();
        //   clearTimeout(gameTimer);
        //   return
        // }

        let minePosition = field.position;
        let row = parseInt(minePosition.split("-")[0])
        let col = parseInt(minePosition.split("-")[1])
        for (let i = row - 1; i < row + 2; i++) {
          if (i < 0 || i > model.rowNum - 1) { continue }

          for (let j = col - 1; j < col + 2; j++) {
            if (j < 0 || j > model.rowNum - 1) { continue }
            let pos = i + "-" + j;
            let fieldAround = model.fields.find(f => f.position === pos);
            if (fieldAround.isDigged === false) {
              //let fieldIndex = model.fields.indexOf(f => f.position === pos);
              if (fieldAround.type === "space") {
                console.log(fieldAround.position)
                this.dig(fieldAround)
              }
              //console.log(field);
              //model.fields[fieldIndex] = field;
            }

          }
        }
      } else {
        view.showFieldContent(field);
        field.isDigged = true;
        model.numOfFlipedField++;
        console.log(model.numOfFlipedField);
        this.GameFinish()
      }
    } else { //按到炸彈
      alert('Boom!!');
      view.showBoard();
      let boomPos = field.position;
      let clickedBoom = document.getElementById(boomPos);
      clickedBoom.classList.add('boomClicked');
      clickedBoom.classList.remove('disabled');
      view.buttonDisable();
      clearTimeout(gameTimer);
    }

  },
  GameFinish() { //判斷過關
    let fieldClickNum = model.fieldsNum - model.mines.length
    if (model.numOfFlipedField === fieldClickNum) {
      alert("You Win!")
      view.showBoard();
      view.showFlag();
      clearTimeout(gameTimer);
      return
    }
  }
}

const model = {
  numOfFlipedField: 0, //被翻開的格子數，利用這個數字判斷遊戲過關否
  numOfFlag: 0, //旗子數量，一開始會由地雷數量初始化
  rowNum: 0, //地圖列數
  fieldsNum: 0, //地圖格子數
  mines: [], //地雷index
  fields: [], //格子資料儲存處
  clickTimes: 0, //計時依據
  isMine(fieldIdx) {
    return this.mines.includes(fieldIdx)
  }

}

const utility = {
  getRandomNumberArray(count) { //取得一個隨機排列的、範圍從 0 到 count參數 的數字陣列
    const number = [...Array(count).keys()]

    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    //console.log(number);
    //number.forEach(num => { num + 1 });
    return number
  }

}

controller.createGame(9, 12)
//controller.setMinesAndFields(12)
// model.fields.forEach(f => {
//   view.showFieldContent(f);
// })

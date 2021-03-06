'use strict';

function createMap() {
  var width = 30;
  var height = 60;
  var maxRoomSize = 16;
  var minRoomSize = 4;
  var maxHallLength = 5;
  var numRooms = 5;
  var roomChance = .75;
  var tileType = {
    WALL: 0,
    FLOOR: 1
  };
  // init grid of walls
  var map = _.fill(Array(width), 0);
  var blankCol = _.fill(Array(height), tileType.WALL);
  map = map.map(function () {
    return blankCol.slice();
  });

  // create first room
  fillRect(map, { x: 5, y: 5 }, { x: 10, y: 10 }, tileType.FLOOR);

  // create rooms
  for (var i = 0; i < numRooms; i++) {
    placeRoom(map);
  }

  return map;

  // map is a grid, startCoord is an object like {x: 13, y: 15}
  // size is an object like {x: 5, y: 7}, fillVal is an int
  function fillRect(map, startCoord, size, fillVal) {
    for (var i = startCoord.x; i < startCoord.x + size.x; i++) {
      _.fill(map[i], fillVal, startCoord.y, size.y + startCoord.y);
    }
    return map;
  }

  // Will keep trying to place random rooms in random places until it succeeds.
  function placeRoom(map) {
    var wall = undefined,
        width = undefined,
        height = undefined,
        isRoom = undefined,
        startX = undefined,
        startY = undefined,
        coords = undefined,
        numClear = undefined;
    while (true) {
      // Create random location and room
      // TODO - Choose wall or hall
      numClear = 0;
      wall = findWall(map);
      coords = wall.coords;
      width = Math.floor(Math.random() * (maxRoomSize - minRoomSize) + minRoomSize);
      height = Math.floor(Math.random() * (maxRoomSize - minRoomSize) + minRoomSize);
      switch (wall.openDir) {
        case 'right':
          startX = coords.x - width;
          startY = coords.y - Math.floor(height / 2) + getDoorOffset(height);
          break;
        case 'left':
          startX = coords.x + 1;
          startY = coords.y - Math.floor(height / 2) + getDoorOffset(height);
          break;
        case 'top':
          startX = coords.x - Math.floor(width / 2) + getDoorOffset(width);
          startY = coords.y + 1;
          break;
        case 'bottom':
          startX = coords.x - Math.floor(width / 2) + getDoorOffset(width);
          startY = coords.y - height;
          break;
        default:
          break;
      }
      // Exit if room would be outside matrix
      if (startX < 0 || startY < 0 || startX + width >= map.length || startY + height >= map[0].length) {
        continue;
      }
      // check if all spaces are clear
      for (var i = startX; i < startX + width; i++) {
        if (map[i].slice(startY, startY + height).every(function (tile) {
          return tile === tileType.WALL;
        })) {
          numClear++;
        }
      }
      if (numClear === width) {
        fillRect(map, { x: startX, y: startY }, { x: width, y: height }, tileType.FLOOR);
        map[coords.x][coords.y] = 1;
        return map;
      }
    }

    function getDoorOffset(length) {
      return Math.floor(Math.random() * length - Math.floor((length - 1) / 2));
    }
  }

  // Loops until it finds a wall tile
  function findWall(map) {
    var coords = { x: 0, y: 0 };
    var wallDir = false;
    do {
      coords.x = Math.floor(Math.random() * map.length);
      coords.y = Math.floor(Math.random() * map[0].length);
      wallDir = isWall(map, coords);
    } while (!wallDir);

    return { coords: coords, openDir: wallDir };
  }

  // Takes a map matrix and a coordinate object
  // Returns false if not a wall, otherwise the direction of the open tile
  function isWall(map, coords) {
    // return false if tile isn't wall
    if (map[coords.x][coords.y] !== tileType.WALL) {
      return false;
    }
    // left is open
    if (typeof map[coords.x - 1] !== 'undefined' && map[coords.x - 1][coords.y] === tileType.FLOOR) {
      return 'left';
    }
    // right is open
    if (typeof map[coords.x + 1] !== 'undefined' && map[coords.x + 1][coords.y] === tileType.FLOOR) {
      return 'right';
    }
    // top is open
    if (map[coords.x][coords.y - 1] === tileType.FLOOR) {
      return 'top';
    }
    // bottom is open
    if (map[coords.x][coords.y + 1] === tileType.FLOOR) {
      return 'bottom';
    }

    return false;
  }
}

var board = [1, 1, 1];
board = board.map(createMap);

var Panel = React.createClass({
  displayName: 'Panel',

  render: function render() {
    var playerHealth = this.props.player.health / this.props.player.max_health * 100;
    var healthDivStyle = {
      width: playerHealth + '%'
    };
    var playerExp = this.props.player.experience / this.props.player.nextLevel * 100;
    var expDivStyle = {
      width: playerExp + '%'
    };
    return React.createElement(
      'div',
      null,
      React.createElement(
        'h1',
        null,
        'Dungeon Crawler'
      ),
      React.createElement(
        'div',
        { id: 'playerHealthPanel' },
        React.createElement('div', { id: 'playerHealthBarPanel', style: healthDivStyle }),
        React.createElement(
          'div',
          { className: 'panelText movetotop', style: { textAlign: 'right' } },
          this.props.player.health,
          '/',
          this.props.player.max_health,
          ' HP'
        )
      ),
      React.createElement(
        'div',
        { style: { textAlign: 'right' } },
        'Dungeon: ',
        this.props.dungeon + 1
      ),
      React.createElement(
        'div',
        { id: 'playerExpPanel' },
        React.createElement('div', { id: 'playerExpBarPanel', style: expDivStyle }),
        React.createElement(
          'div',
          { className: 'panelText movetotop', style: { textAlign: 'right' } },
          this.props.player.experience,
          '/',
          this.props.player.nextLevel,
          ' EXP'
        )
      ),
      React.createElement(
        'div',
        { style: { textAlign: 'right' } },
        'Level: ',
        this.props.player.level
      )
    );
  }
});

var Map = React.createClass({
  displayName: 'Map',

  render: function render() {
    var healthPlayer = this.props.player.health / this.props.player.max_health * 100;
    var rows = this.props.board.map(function (item, idx_r) {
      var cells = item.map(function (element, idx_c) {
        if (element === 'player') {
          return React.createElement('span', { className: element, id: 100 * idx_r + idx_c }, React.createElement('div', { id: 'playerHealth' }, React.createElement('div', { id: 'playerHealthBar', style: { 'width': healthPlayer + '%' } })), ' ');
        }
        if (~element.toString().indexOf('villain')) {
          var idx = parseInt(element[element.length - 1]);
          var villainHealth = 100 * this.props.villain[idx].health / this.props.villain[idx].max_health;
          return React.createElement('span', { className: 'villain ' + element, id: 100 * idx_r + idx_c }, React.createElement('div', { id: element + 'Health' }, React.createElement('div', { id: element + 'HealthBar', style: { 'width': villainHealth + '%' } })), ' ');
        }
        if (element === 'boss') {
          var bossHealth = 100 * this.props.boss.health / this.props.boss.max_health;
          return React.createElement('span', { className: 'boss', id: 100 * idx_r + idx_c }, React.createElement('div', { id: element + 'Health' }, React.createElement('div', { id: element + 'HealthBar', style: { 'width': bossHealth + '%' } })), ' ');
        }
        if (~['ladder', 'potion', 'armour', 'weapon'].indexOf(element)) {
          return React.createElement('span', { className: element, id: 100 * idx_r + idx_c }, ' ');
        }
        return React.createElement('span', { className: 'tile' + element, id: 100 * idx_r + idx_c }, ' ');
      }.bind(this));
      return React.createElement('div', { className: 'mapRow' }, cells);
    }.bind(this));

    return React.createElement('div', null, rows);
  }
});

var Shadow = React.createClass({
  displayName: 'Shadow',

  render: function render() {
    var table = this.props.shadow.map(function (item, idx_r) {
      var cells = item.map(function (element, idx_c) {
        return React.createElement('span', { className: element, id: 100 * idx_r + idx_c }, ' ');
      }.bind(this));
      return React.createElement('div', { className: 'mapRow' }, cells);
    }.bind(this));
    return React.createElement('div', null, table);
  }
});

var Play = React.createClass({
  displayName: 'Play',

  getInitialState: function getInitialState() {
    return {
      player: {
        health: 100,
        max_health: 100,
        attack: 5,
        defend: 5,
        experience: 0,
        level: 1,
        nextLevel: 200,
        position: { x: 0, y: 0 }
      },
      dungeon: 0,
      ladder: { position: { x: 0, y: 0 } },
      villain: [{
        health: 30, max_health: 30, attack: 4, defend: 5, position: { x: 0, y: 0 }
      }, {
        health: 40, max_health: 40, attack: 3, defend: 7, position: { x: 0, y: 0 }
      }, {
        health: 50, max_health: 50, attack: 5, defend: 1, position: { x: 0, y: 0 }
      }, {
        health: 20, max_health: 20, attack: 5, defend: 5, position: { x: 0, y: 0 }
      }, {
        health: 60, max_health: 60, attack: 2, defend: 3, position: { x: 0, y: 0 }
      }],
      boss: { health: 200, max_health: 200, attack: 10, defend: 10, position: { x: 0, y: 0 } },
      weapon: { attack: 3, position: { x: 0, y: 0 } },
      armour: { defend: 3, position: { x: 0, y: 0 } },
      board: this.props.board[0],
      shadow: this.props.board[0],
      potions: [{ position: { x: 0, y: 0 } }, { position: { x: 0, y: 0 } }, { position: { x: 0, y: 0 } }]
    };
  },
  generatePosition: function generatePosition() {
    function setPosition(board, object) {
      object.position = { x: 0, y: 0 };
      while (board[object.position.x][object.position.y] === 0) {
        object.position.x = Math.floor(Math.random() * board.length);
        object.position.y = Math.floor(Math.random() * board[0].length);
        if (board[object.position.x][object.position.y] === 1) {
          return object;
        }
      }
      return object;
    }
    var curBoard = this.state.board;
    var curPlayer = this.state.player;
    var curWeapon = this.state.weapon;
    var curArmour = this.state.armour;
    var curPotions = this.state.potions;
    var curVillain = this.state.villain;
    var curLadder = this.state.ladder;
    var curShadow = this.state.shadow;
    curPlayer = setPosition(curBoard, curPlayer);
    curBoard[curPlayer.position.x][curPlayer.position.y] = 'player';

    curShadow = curShadow.map(function (row, idx_r) {
      var row = row.map(function (col, idx_c) {
        var dist = Math.abs(idx_c - curPlayer.position.y) + Math.abs(idx_r - curPlayer.position.x);
        if (dist <= 7) {
          return 'shadow' + dist;
        } else {
          return 'dark';
        }
      });
      return row;
    });

    curWeapon = setPosition(curBoard, curWeapon);
    curBoard[curWeapon.position.x][curWeapon.position.y] = 'weapon';
    curArmour = setPosition(curBoard, curArmour);
    curBoard[curArmour.position.x][curArmour.position.y] = 'armour';
    curPotions = curPotions.map(function (element) {
      var potion = setPosition(curBoard, element);
      curBoard[potion.position.x][potion.position.y] = 'potion';
      return potion;
    });
    curVillain = curVillain.map(function (element, idx) {
      var villain = setPosition(curBoard, element);
      curBoard[villain.position.x][villain.position.y] = 'villain' + idx;
      return villain;
    });
    if (this.state.dungeon < 2) {
      curLadder = setPosition(curBoard, curLadder);
      curBoard[curLadder.position.x][curLadder.position.y] = 'ladder';
      this.setState({ player: curPlayer, board: curBoard, weapon: curWeapon, armour: curArmour, villain: curVillain, ladder: curLadder, shadow: curShadow });
    } else {
      var curBoss = this.state.boss;
      curBoss = setPosition(curBoard, curBoss);
      curBoard[curBoss.position.x][curBoss.position.y] = 'boss';
      this.setState({ player: curPlayer, board: curBoard, weapon: curWeapon, armour: curArmour, villain: curVillain, shadow: curShadow });
    }
  },
  componentWillMount: function componentWillMount() {
    this.generatePosition();
    document.addEventListener("keydown", this.handlePlayerMove, false);
  },
  handlePlayerMove: function handlePlayerMove(event) {
    if (event.keyCode === 37) {
      var nextPos = { x: this.state.player.position.x, y: this.state.player.position.y - 1 };
    }
    if (event.keyCode === 38) {
      var nextPos = { x: this.state.player.position.x - 1, y: this.state.player.position.y };
    }
    if (event.keyCode === 39) {
      var nextPos = { x: this.state.player.position.x, y: this.state.player.position.y + 1 };
    }
    if (event.keyCode === 40) {
      var nextPos = { x: this.state.player.position.x + 1, y: this.state.player.position.y };
    }

    var curPlayer = this.state.player;
    var curBoard = this.state.board;
    var curShadow = this.state.shadow;
    console.log(this.state.board[nextPos.x][nextPos.y]);
    if (~[1, 'potion', 'armour', 'weapon'].indexOf(this.state.board[nextPos.x][nextPos.y])) {
      curBoard[curPlayer.position.x][curPlayer.position.y] = 1;
      curPlayer.position = nextPos;
      if (this.state.board[nextPos.x][nextPos.y] === 'potion') {
        curPlayer.health = Math.min(curPlayer.max_health, curPlayer.health + 20);
      }
      if (this.state.board[nextPos.x][nextPos.y] === 'weapon') {
        curPlayer.attack += this.state.weapon.attack;
        console.log(curPlayer);
      }
      if (this.state.board[nextPos.x][nextPos.y] === 'armour') {
        curPlayer.defend += this.state.armour.defend;
        console.log(curPlayer);
      }
      curBoard[curPlayer.position.x][curPlayer.position.y] = 'player';
      curShadow = curShadow.map(function (row, idx_r) {
        var row = row.map(function (col, idx_c) {
          var dist = Math.abs(idx_c - curPlayer.position.y) + Math.abs(idx_r - curPlayer.position.x);
          if (dist <= 7) {
            return 'shadow' + dist;
          } else {
            return 'dark';
          }
        });
        return row;
      });
      this.setState({ board: curBoard, player: curPlayer, shadow: curShadow });
    }
    if (~this.state.board[nextPos.x][nextPos.y].toString().indexOf('villain')) {
      var villain = this.state.villain;
      var idx = parseInt(this.state.board[nextPos.x][nextPos.y][this.state.board[nextPos.x][nextPos.y].length - 1]);
      var playerHit = this.state.player.attack - Math.round(0.25 * villain[idx].defend) + Math.floor(Math.random() * 7) - 3;
      var villainHit = villain[idx].attack - Math.round(0.25 * this.state.player.defend) + Math.floor(Math.random() * 7) - 3;
      curPlayer.health -= villainHit;
      villain[idx].health -= playerHit;
      if (curPlayer.health <= 0) {
        alert('You lose!');
      }
      if (villain[idx].health <= 0) {
        curBoard[villain[idx].position.x][villain[idx].position.y] = 1;
        curPlayer.experience += villain[idx].max_health;
        if (curPlayer.experience >= curPlayer.nextLevel) {
          curPlayer.level++;
          curPlayer.nextLevel += 1.5 * curPlayer.nextLevel;
          curPlayer.max_health += 50;
          curPlayer.health += 50;
          curPlayer.attack *= 1.25;
          curPlayer.defend *= 1.25;
        }
        this.setState({ board: curBoard, player: curPlayer, villain: villain });
      } else {
        this.setState({ player: curPlayer, villain: villain });
      }
      console.log(curPlayer);
    }
    if (this.state.board[nextPos.x][nextPos.y] === 'boss') {
      var boss = this.state.boss;
      var playerHit = this.state.player.attack - Math.round(0.25 * boss.defend) + Math.floor(Math.random() * 7) - 3;
      var bossHit = boss.attack - Math.round(0.25 * this.state.player.defend) + Math.floor(Math.random() * 7) - 3;
      curPlayer.health -= bossHit;
      boss.health -= playerHit;
      if (boss.health <= 0) {
        alert('You win!');
      } else if (curPlayer.health <= 0) {
        alert('You lose!');
      } else {
        this.setState({ player: curPlayer, boss: boss });
      }
    }
    if (this.state.board[nextPos.x][nextPos.y] === 'ladder') {
      var curDungeon = this.state.dungeon;
      this.setState({ board: this.props.board[curDungeon + 1], dungeon: curDungeon + 1 });
      this.generatePosition();
      var curBoard = this.state.board;
      var curWeapon = this.state.weapon;
      var curArmour = this.state.armour;
      var curVillain = this.state.villain;
      curArmour.defend += 2;
      curWeapon.attack += 2;

      curVillain = curVillain.map(function (element) {
        element.attack += 1;
        element.defend += 1;
        element.max_health *= 1.5;
        element.health = element.max_health;
        return element;
      });
      this.setState({ board: curBoard, weapon: curWeapon, armour: curArmour, villain: curVillain });
    }
  },
  render: function render() {
    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { id: 'panel' },
        React.createElement(Panel, { player: this.state.player, dungeon: this.state.dungeon })
      ),
      React.createElement(
        'div',
        { id: 'map' },
        React.createElement(Map, { board: this.state.board, player: this.state.player, villain: this.state.villain, boss: this.state.boss, shadow: this.state.shadow })
      ),
      React.createElement(
        'div',
        { id: 'shadow', className: 'movetotop' },
        React.createElement(Shadow, { shadow: this.state.shadow })
      )
    );
  }
});

ReactDOM.render(React.createElement(Play, { board: board }), document.getElementById('game'));
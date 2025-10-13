let xp = 0;
let health = 100;
let gold = 50;
let currentWeapon = 0;
let fighting;
let monsterHealth;
let inventory = ["stick"];

const button1 = document.querySelector("#button1");
const button2 = document.querySelector("#button2");
const button3 = document.querySelector("#button3");
const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const monsterStats = document.querySelector("#monsterStats");
const monsterName = document.querySelector("#monsterName");
const monsterHealthText = document.querySelector("#monsterHealth");

const locations = [
  {
    name: "town square",
    "button text": ["Go to store", "Go to cave", "Fight dragon"],
    "button functions": [goStore, goCave, fightDragon],
    text: "You are in the town square. You see a sign that says 'Store'."
  },
  {
    name: "store",
    "button text": ["Buy 10 health (10 gold)", "Buy weapon (30 gold)", "Go to town square"],
    "button functions": [buyHealth, buyWeapon, goTown],
    text: "You enter the store."
  },
  {
    name: "cave",
    "button text": ["Fight slime", "Fight fanged beast", "Go to town square"],
    "button functions": [fightSlime, fightBeast, goTown],
    text: "You enter the cave. You see some monsters."
  },
  {
    name: "fight",
    "button text": ["Attack", "Dodge", "Run"],
    "button functions": [attack, dodge, goTown],
    text: "You are fighting a monster."
  },
  {
    name: "kill monster",
    "button text": ["Go to town square", "Go to town square", "Go to town square"],
    "button functions": [goTown, goTown, goTown],
    text: "The monster screams 'Arg!' as it dies. You gain experience and gold."
  },
  {
    name: "lose",
    "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
    "button functions": [restart, restart, restart],
    text: "You die. ☠️"
  },
  {
    name: "win",
    "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
    "button functions": [restart, restart, restart],
    text: "You defeated the dragon! You win the game! 🎉"
  }
];

const monsters = [
  { name: "Slime", level: 2, health: 15 },
  { name: "Fanged Beast", level: 8, health: 60 },
  { name: "Dragon", level: 20, health: 300 }
];

const weapons = [
  { name: "stick", power: 5 },
  { name: "dagger", power: 30 },
  { name: "claw hammer", power: 50 },
  { name: "sword", power: 100 }
];

button1.onclick = goStore;
button2.onclick = goCave;
button3.onclick = fightDragon;

function update(location) {
  monsterStats.classList.add("hidden");
  button1.textContent = location["button text"][0];
  button2.textContent = location["button text"][1];
  button3.textContent = location["button text"][2];
  button1.onclick = location["button functions"][0];
  button2.onclick = location["button functions"][1];
  button3.onclick = location["button functions"][2];
  text.textContent = location.text;
}

function goTown() {
  update(locations[0]);
}

function goStore() {
  update(locations[1]);
}

function goCave() {
  update(locations[2]);
}

function buyHealth() {
  if (gold >= 10) {
    gold -= 10;
    health += 10;
    goldText.textContent = gold;
    healthText.textContent = health;
    text.textContent = "You bought 10 health.";
  } else {
    text.textContent = "You don’t have enough gold.";
  }
}

function buyWeapon() {
  if (currentWeapon < weapons.length - 1) {
    if (gold >= 30) {
      gold -= 30;
      currentWeapon++;
      goldText.textContent = gold;
      let newWeapon = weapons[currentWeapon].name;
      inventory.push(newWeapon);
      text.textContent = "You now have a " + newWeapon + ".";
    } else {
      text.textContent = "You don’t have enough gold.";
    }
  } else {
    text.textContent = "You already have the most powerful weapon!";
  }
}

function fightSlime() {
  fighting = 0;
  goFight();
}

function fightBeast() {
  fighting = 1;
  goFight();
}

function fightDragon() {
  fighting = 2;
  goFight();
}

function goFight() {
  update(locations[3]);
  monsterHealth = monsters[fighting].health;
  monsterStats.classList.remove("hidden");
  monsterName.textContent = monsters[fighting].name;
  monsterHealthText.textContent = monsterHealth;
}

function attack() {
  let damage = weapons[currentWeapon].power + Math.floor(Math.random() * xp);
  monsterHealth -= damage;
  monsterHealthText.textContent = monsterHealth;
  text.textContent = "You attack the " + monsters[fighting].name + " with your " + weapons[currentWeapon].name + ".";
  if (monsterHealth <= 0) {
    fighting === 2 ? winGame() : defeatMonster();
  } else {
    health -= monsters[fighting].level;
    healthText.textContent = health;
    if (health <= 0) {
      loseGame();
    }
  }
}

function dodge() {
  text.textContent = "You dodge the attack from the " + monsters[fighting].name + "!";
}

function defeatMonster() {
  gold += Math.floor(monsters[fighting].level * 6.7);
  xp += monsters[fighting].level;
  goldText.textContent = gold;
  xpText.textContent = xp;
  update(locations[4]);
}

function loseGame() {
  update(locations[5]);
}

function winGame() {
  update(locations[6]);
}

function restart() {
  xp = 0;
  health = 100;
  gold = 50;
  currentWeapon = 0;
  inventory = ["stick"];
  xpText.textContent = xp;
  healthText.textContent = health;
  goldText.textContent = gold;
  goTown();
}

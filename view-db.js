const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("db.sqlite");

function getHeadlines() {
  console.log(" --- headlines --- ");
  db.serialize(() => {
    var headlines = db.each("SELECT * FROM headlines", (err, result) => {
      const { id, headline, firstSeen, lastSeen } = result;
      const timeAlive = ` / active for ~${Math.floor(
        (Date.parse(lastSeen) - Date.parse(firstSeen)) / (1000 * 60)
      )} min`;
      console.log(id, headline, timeAlive);
    });
  });
}

getHeadlines();

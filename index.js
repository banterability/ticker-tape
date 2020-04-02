const fetch = require("node-fetch");
const { parse } = require("node-html-parser");
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("db.sqlite");

function insertNewHeadline(headline) {
  db.serialize(() => {
    var stmt = db.prepare("INSERT INTO headlines (headline) VALUES (?)");
    stmt.run(headline);
    stmt.finalize();
  });
}

function updateExistingHeadline(headlineId) {
  db.serialize(() => {
    var stmt = db.prepare(
      "UPDATE headlines SET lastSeen = CURRENT_TIMESTAMP WHERE id = (?)"
    );
    stmt.run(headlineId);
    stmt.finalize();
  });
}

function getLatestHeadline(cb) {
  db.serialize(() => {
    db.get("SELECT id, headline FROM headlines ORDER BY id DESC LIMIT 1", cb);
  });
}

function captureHeadline() {
  console.log("   ---------   ");
  fetch("https://www.cnbc.com/")
    .then((body) => body.text())
    .then((html) => {
      const tree = parse(html);

      return Promise.resolve(
        tree.querySelector(".FeaturedCard-container h2").text
      );
    })
    .then((latestHeadline) => {
      console.log(`📰 ${latestHeadline} 📰`);
      getLatestHeadline((err, result) => {
        if (result) {
          const { id, headline } = result;

          if (headline === latestHeadline) {
            console.log(
              `  -> no change; bumping timestamp on headline (pk: ${id})`
            );
            updateExistingHeadline(id);
          } else {
            console.log("  -> saving new headline:", latestHeadline);
            insertNewHeadline(latestHeadline);
          }
        } else {
          console.log("  -> saving new headline:", latestHeadline);
          insertNewHeadline(latestHeadline);
        }
      });
    })
    .catch((err) => {
      console.error("err", err);
    });
}

captureHeadline();
setInterval(captureHeadline, 1000 * 30);

const express = require("express");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "userData.db");
let db = null;

async function initializeDb() {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}

function runServer() {
  try {
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
}

initializeDb();
runServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let checkForUserQuery = `SELECT * FROM USER WHERE username = '${username}';`;
  const result = await db.get(checkForUserQuery);
  if (result === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedPassword = await bcrypt.hash(password, 10);
      let InsertQuery = `INSERT INTO
                    USER (username, name, password, gender, location)
                    VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      let result = await db.run(InsertQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  let checkForUserQuery = `SELECT * FROM USER WHERE username = '${username}';`;
  const user = await db.get(checkForUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    if (await bcrypt.compare(password, user.password)) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  let checkForUserQuery = `SELECT * FROM USER WHERE username = '${username}';`;
  const user = await db.get(checkForUserQuery);
  let isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (isPasswordCorrect) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      let updatePasswordQuery = `UPDATE USER SET password = '${newHashedPassword}' WHERE username = '${username}'`;
      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;

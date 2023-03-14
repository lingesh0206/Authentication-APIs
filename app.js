const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let dbObject = null;

const intializeDBAndServer = async () => {
  try {
    dbObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

intializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await dbObject.get(selectUserQuery);
  if (userDetails === undefined) {
    if (password.length >= 5) {
      const createUserQuery = `INSERT INTO user
            (username, name, password, gender, location)
            values ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      await dbObject.run(createUserQuery);

      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API-2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await dbObject.get(selectUserQuery);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await dbObject.get(selectUserQuery);
  const isoldPasswordMatch = await bcrypt.compare(
    oldPassword,
    userDetails.password
  );
  if (isoldPasswordMatch === true) {
    if (newPassword.length >= 5) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateUserQuery = `UPDATE user set
            password = '${hashedPassword}' where username = '${username}';`;
      await dbObject.run(updateUserQuery);

      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;

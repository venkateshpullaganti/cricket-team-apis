const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketTeam.db");

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http:localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

const ConvertDBDataToResponseFormat = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
   SELECT * FROM cricket_team
   `;
  const allPlayers = await db.all(getAllPlayersQuery);
  const formattedPlayers = allPlayers.map((eachPlayer) =>
    ConvertDBDataToResponseFormat(eachPlayer)
  );
  response.send(formattedPlayers);
});

app.post("/players/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName, jerseyNumber, role } = playerDetails;
  const addPlayerQuery = `INSERT INTO 
  cricket_team(player_name,jersey_number, role)
    VALUES (
     "${playerName}",
     "${jerseyNumber}",
     "${role}");
`;
  const dbResponse = await db.run(addPlayerQuery);
  const playerId = dbResponse.lastID;
  response.send("Player Added to Team");
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM cricket_team WHERE player_id=${playerId};`;
  const playerDetails = await db.get(getPlayerQuery);
  const responseObject = ConvertDBDataToResponseFormat(playerDetails);

  response.send(responseObject);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName, jerseyNumber, role } = request.body;
  const updatePlayerQuery = `UPDATE cricket_team
   SET player_name="${playerName}",jersey_number="${jerseyNumber}",role="${role}" 
   WHERE player_id=${playerId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const deletePlayerQuery = `DELETE FROM cricket_team WHERE player_id=${playerId}`;
  await db.run(deletePlayerQuery);
  response.send("Player Removed");
});

initialiseDBAndServer();

module.exports = app;

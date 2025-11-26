const oracledb = require("oracledb");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // <-- OBLIGATOIRE

// Active le mode THICK
oracledb.initOracleClient({
    libDir: "C:\\Users\\killi\\Desktop\\DATABASE ORACLE\\instantclient_23_0"
});

// Config Oracle
const dbConfig = {
    user: "kikidb",
    password: "kiki123",
    connectString: "localhost:1521/XE"
};

// GET
app.get("/player", async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT ID_PLAYER FROM PLAYERS`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la connexion Oracle");
    }

});
// GET
app.get("/server", async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT DISTINCT ID_SERVER FROM PLAYERS`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la connexion Oracle");
    }

});

// POST
app.post("/addplayer", async (req, res) => {
    let connection;

    const { id_player, id_server } = req.body;

    if (id_player == "" || id_server == "") {
        return res.status(400).json({ error: "id_player et id_server requis" });
    }

    try {
        connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `INSERT INTO PLAYERS (ID_PLAYER, ID_SERVER)
             VALUES (:id_player, :id_server)`,
            { id_player, id_server },
            { autoCommit: true }
        );

        res.json({ message: "Player ajouté !" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de l'insertion Oracle");
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { }
        }
    }
});

// POST
app.post("/delplayer", async (req, res) => {
    let connection;

    const { id_player, id_server } = req.body;

    if (!id_player || !id_server) {
        return res.status(400).json({ error: "id_player et id_server requis" });
    }

    try {
        connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `DELETE FROM PLAYERS WHERE id_player = :id_player and id_server = :id_server`,
            { id_player, id_server },
            { autoCommit: true }
        );

        res.json({ message: "Player supprimé !" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de l'insertion Oracle");
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { }
        }
    }
});
// Serveur
app.listen(PORT, () => {
    console.log(`Serveur Node.js lancé sur http://localhost:${PORT}`);
});

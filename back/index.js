const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// --- fonctions utilitaires NE PAS TOUCHES --- //
function lireJSON() {
    const data = fs.readFileSync("./database.json", "utf8");
    return JSON.parse(data);
}

function ecrireJSON(obj) {
    fs.writeFileSync("./database.json", JSON.stringify(obj, null, 2));
}


// --- ROUTE : modifier le JSON --- //
app.post("/api/update", (req, res) => {
    const { nom } = req.body;  // prends ce que React a envoyé

});

// --- DEMARRER LE SERVEUR --- //
app.listen(5000, () => {
    console.log("Backend OK -> http://localhost:5000");
});

import { useState } from "react";

export default function AddPlayer() {
    const [playername, setPlayername] = useState("");
    const [serveur, setServeur] = useState("");

    const sendadd = async () => {
        try {
            const res = await fetch("http://localhost:3000/addplayer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_player: playername,
                    id_server: serveur
                })
            });

            const data = await res.json();
            console.log("Réponse :", data);
            alert("Player ajouté !");
        } catch (err) {
            console.error(err);
        }
    };

    const senddel = async () => {
        try {
            const res = await fetch("http://localhost:3000/delplayer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_player: playername,
                    id_server: serveur
                })
            });

            const data = await res.json();
            console.log("Réponse :", data);
            alert("Player Supprimé !");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
        <h1>Ajouté un joueur</h1>
            <label htmlFor="name">Name (4 to 8 characters):</label>
            <input
                type="text"
                id="name"
                required
                minLength="4"
                maxLength="8"
                placeholder="Pseudo"
                size="10"
                onChange={(e) => setPlayername(e.target.value)}
            />

            <label htmlFor="server">Server (serverxx):</label>
            <input
                type="text"
                id="server"
                required
                minLength="4"
                maxLength="8"
                placeholder="Session"
                size="10"
                onChange={(e) => setServeur(e.target.value)}
            />

            <button onClick={sendadd}>ADD</button>
            <br />
            <br />
            <h1>Supprimé un Joueur</h1>
            <label htmlFor="name">Name (4 to 8 characters):</label>
            <input
                type="text"
                id="name"
                required
                minLength="4"
                maxLength="8"
                placeholder="Pseudo"
                size="10"
                onChange={(e) => setPlayername(e.target.value)}
            />

            <label htmlFor="server">Server (serverxx):</label>
            <input
                type="text"
                id="server"
                required
                minLength="4"
                maxLength="8"
                placeholder="Session"
                size="10"
                onChange={(e) => setServeur(e.target.value)}
            />

            <button onClick={senddel}>DEL</button>
        </>
    );
}

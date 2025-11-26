import { useEffect, useState } from "react";

function Players() {
    const [players, setPlayers] = useState([]);
    const [server, setServer] = useState([]);
    useEffect(() => {
        fetch("http://localhost:3000/player")
            .then(response => response.json())
            .then(data => {
                console.log("Players :", data);
                setPlayers(data);
            })
            .catch(err => console.error(err));
    }, []); 
    useEffect(() => {
        fetch("http://localhost:3000/server")
            .then(response => response.json())
            .then(data => {
                console.log("Server :", data);
                setServer(data);
            })
            .catch(err => console.error(err));
    }, []); 

    return (
        <div>
            <h2>Players : {players.length}</h2>
                {players.map((p) => (
                    <li>
                        <strong>{p.ID_PLAYER}</strong>
                    </li>
                ))}
                <br />
                <br />
                <h2>Server:</h2>
            {server.map((p) => (
                <li key={p.ID_SERVER}>
                    <strong>{p.ID_SERVER}</strong>
                </li>
            ))}
                <br />
                <br />
                <br />
        </div>
    );
}

export default Players;

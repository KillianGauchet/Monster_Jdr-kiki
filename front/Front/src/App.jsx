import { useState } from "react";

export default function App() {
  const [nom, setNom] = useState("");
  const [reponse, setReponse] = useState("");

  function handleSend() {
    fetch("http://localhost:5000/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: nom })
    })
      .then(res => res.json())        // lire la réponse JSON
      .then(data => {
        setReponse(data.status);      // stocker la réponse
        console.log(data);            // affiche toute la réponse
      });
  }

  return (
    <div>
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Tape un nom"
      />
      <button onClick={handleSend}>Envoyer</button>

      <p>Réponse backend : {reponse}</p>
    </div>
  );
}

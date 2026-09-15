interface Props {
  messaggio: string;
  cosaIgnorare: string[];
}

export default function EmptyState({ messaggio, cosaIgnorare }: Props) {
  return (
    <main className="daily empty-state">
      <h1>Nessun modulo pronto</h1>
      <p className="empty-state-messaggio">{messaggio}</p>
      <p className="empty-state-nota">
        Non è un errore: succede al primo avvio e ogni volta che la routine Cowork resta ferma per più di due
        settimane. Il buffer si riempie da solo quando la routine gira di nuovo.
      </p>
      {cosaIgnorare.length > 0 && (
        <section className="daily-ignora">
          <h2>Cosa ignorare oggi</h2>
          <ul>
            {cosaIgnorare.map((riga, i) => (
              <li key={i}>{riga}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

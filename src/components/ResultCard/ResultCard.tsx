import "./ResultCard.css";

interface Props {
  title: string;
  rows: string[];
}

export default function ResultCard({ title, rows }: Props) {
  return (
    <section className="resultCard">
      <h3>{title}</h3>
      <ul>
        {rows.map((row, idx) => <li key={idx}>{row}</li>)}
      </ul>
    </section>
  );
}

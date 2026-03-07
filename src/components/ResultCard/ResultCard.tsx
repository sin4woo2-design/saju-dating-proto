import "./ResultCard.css";

interface Props {
  title: string;
  rows: string[];
  tone?: "default" | "highlight";
}

export default function ResultCard({ title, rows, tone = "default" }: Props) {
  return (
    <section className={`resultCard ${tone === "highlight" ? "highlight" : ""}`}>
      <h3>{title}</h3>
      <ul>
        {rows.map((row, idx) => <li key={idx}>{row}</li>)}
      </ul>
    </section>
  );
}

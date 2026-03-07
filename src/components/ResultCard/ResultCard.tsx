import './ResultCard.css';

type Props = {
  title: string;
  items: string[];
};

export default function ResultCard({ title, items }: Props) {
  return (
    <section className="result-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

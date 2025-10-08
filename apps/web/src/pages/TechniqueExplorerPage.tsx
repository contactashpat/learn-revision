import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTechniques } from '../api/operations';

const TechniqueExplorerPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['techniques'],
    queryFn: fetchTechniques,
  });

  return (
    <main className="main-layout" aria-labelledby="technique-explorer-heading">
      <header>
        <h1 id="technique-explorer-heading" className="section-heading">
          Technique Explorer
        </h1>
        <p>
          Discover Italian learning techniques supported by the assistant, review their inputs, and
          launch a practice session tailored to your goal.
        </p>
      </header>

      {isLoading && <p role="status">Loading techniques…</p>}
      {error && (
        <div role="alert" aria-live="assertive">
          <p>Unable to load techniques. Please try again later.</p>
        </div>
      )}

      <section aria-label="Available techniques">
        <div className="card-grid">
          {data?.techniques.map((technique) => (
            <article className="card" key={technique.technique} aria-labelledby={`${technique.technique}-heading`}>
              <h2 id={`${technique.technique}-heading`}>{technique.technique.replace('_', ' ')}</h2>
              <p>
                <strong>Preferred language:</strong> {technique.language.toUpperCase()}
              </p>
              <p>
                <strong>Input fields:</strong>
              </p>
              <ul>
                {technique.inputFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
              <p>
                <strong>Guardrails:</strong> {technique.guardrails.maxAnswerLength} max characters;
                required fields: {technique.guardrails.requiredFields.join(', ')}
              </p>
              <Link to={`/practice/${technique.technique}`}>
                <button type="button">Start practice</button>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default TechniqueExplorerPage;

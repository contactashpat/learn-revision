import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchTechniques } from '../api/operations';
import MnemonicPractice from '../components/MnemonicPractice';
import StoryPractice from '../components/StoryPractice';
import FlashcardsPractice from '../components/FlashcardsPractice';

const friendlyNames: Record<string, string> = {
  mnemonic_it: 'Mnemonic Studio',
  story_it: 'Story Studio',
  flashcards_index_it: 'Flashcards Studio',
};

const PracticeStudioPage = () => {
  const { technique = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['techniques'],
    queryFn: fetchTechniques,
  });

  const techniqueDetails = data?.techniques.find((item) => item.technique === technique);

  if (!friendlyNames[technique ?? '']) {
    return (
      <main className="main-layout" aria-labelledby="unknown-technique-heading">
        <h1 id="unknown-technique-heading">Technique not found</h1>
        <p>
          The requested technique is not available. Return to the explorer to choose one of the
          supported flows.
        </p>
        <Link to="/">
          <button type="button">Go back to Explorer</button>
        </Link>
      </main>
    );
  }

  return (
    <main className="main-layout" aria-labelledby="practice-studio-heading">
      <header>
        <h1 id="practice-studio-heading" className="section-heading">
          {friendlyNames[technique]}
        </h1>
        <p>
          Guided practice session using the {technique?.replace('_', ' ')} technique. Provide the
          required context and the assistant will craft Italian learning artifacts tailored to you.
        </p>
        <p>
          <Link to="/" aria-label="Back to Technique Explorer">
            <button type="button">Back to Explorer</button>
          </Link>
        </p>
      </header>

      {isLoading && <p role="status">Loading technique details…</p>}
      {error && (
        <div role="alert" aria-live="assertive">
          <p>Unable to fetch technique guardrails. Practice inputs may not be validated.</p>
        </div>
      )}

      {technique === 'mnemonic_it' && <MnemonicPractice guardrails={techniqueDetails?.guardrails} />}
      {technique === 'story_it' && <StoryPractice guardrails={techniqueDetails?.guardrails} />}
      {technique === 'flashcards_index_it' && (
        <FlashcardsPractice guardrails={techniqueDetails?.guardrails} />
      )}
    </main>
  );
};

export default PracticeStudioPage;

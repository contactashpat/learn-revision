import { graphqlRequest } from './client';

export interface TechniqueSummary {
  technique: string;
  version: string;
  language: string;
  inputFields: string[];
  guardrails: {
    maxAnswerLength: number;
    requiredFields: string[];
  };
}

export interface TechniquesQueryData {
  techniques: TechniqueSummary[];
}

const TECHNIQUES_QUERY = /* GraphQL */ `
  query TechniqueExplorer {
    techniques {
      technique
      version
      language
      inputFields
      guardrails {
        maxAnswerLength
        requiredFields
      }
    }
  }
`;

export const fetchTechniques = () => graphqlRequest<TechniquesQueryData>({ query: TECHNIQUES_QUERY });

export interface MnemonicInput {
  term: string;
  definition: string;
}

export interface StoryInput {
  concepts: string[];
  targetAudience: string;
  learningGoal: string;
}

export interface FlashcardsInput {
  topic: string;
  items: Array<{ term: string; definition: string }>;
}

export interface MnemonicResult {
  createMnemonic: {
    mnemonic: string;
    explanation: string;
    keywords: string[];
  };
}

const CREATE_MNEMONIC_MUTATION = /* GraphQL */ `
  mutation CreateMnemonic($input: CreateMnemonicInput!, $version: String) {
    createMnemonic(input: $input, version: $version) {
      mnemonic
      explanation
      keywords
    }
  }
`;

export const createMnemonicMutation = (variables: { input: MnemonicInput; version?: string }) =>
  graphqlRequest<MnemonicResult, typeof variables>({ query: CREATE_MNEMONIC_MUTATION, variables });

export interface StoryResult {
  createStory: {
    story: string;
    summary: string;
    keyPoints: string[];
  };
}

const CREATE_STORY_MUTATION = /* GraphQL */ `
  mutation CreateStory($input: CreateStoryInput!, $version: String) {
    createStory(input: $input, version: $version) {
      story
      summary
      keyPoints
    }
  }
`;

export const createStoryMutation = (variables: { input: StoryInput; version?: string }) =>
  graphqlRequest<StoryResult, typeof variables>({ query: CREATE_STORY_MUTATION, variables });

export interface FlashcardsResult {
  createFlashcards: {
    topic: string;
    flashcards: Array<{ index: number; question: string; answer: string }>;
  };
}

const CREATE_FLASHCARDS_MUTATION = /* GraphQL */ `
  mutation CreateFlashcards($input: CreateFlashcardsInput!, $version: String) {
    createFlashcards(input: $input, version: $version) {
      topic
      flashcards {
        index
        question
        answer
      }
    }
  }
`;

export const createFlashcardsMutation = (variables: { input: FlashcardsInput; version?: string }) =>
  graphqlRequest<FlashcardsResult, typeof variables>({ query: CREATE_FLASHCARDS_MUTATION, variables });

export interface CoachResult {
  coach: {
    technique: string;
    advice: string;
    rationale: string;
  };
}

const COACH_QUERY = /* GraphQL */ `
  query Coach($topic: String!, $level: CoachLevel!) {
    coach(topic: $topic, level: $level) {
      technique
      advice
      rationale
    }
  }
`;

export const coachQuery = (variables: { topic: string; level: string }) =>
  graphqlRequest<CoachResult, typeof variables>({ query: COACH_QUERY, variables });

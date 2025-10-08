import { Route, Routes, Navigate } from 'react-router-dom';
import TechniqueExplorerPage from './pages/TechniqueExplorerPage';
import PracticeStudioPage from './pages/PracticeStudioPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<TechniqueExplorerPage />} />
      <Route path="/practice/:technique" element={<PracticeStudioPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

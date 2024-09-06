import { Routes, Route } from 'react-router-dom';
import './css/main.scss';
import Home from './Pages/Home/Home';
import Form from './Pages/Form/Form';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/form" element={<Form />} />
    </Routes>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold tracking-tight">
          <span className="text-violet-400">Querious</span>
        </h1>
        <p className="text-2xl text-gray-400 font-light">Ask your data anything</p>
        <p className="text-sm text-gray-600 mt-8">AI-powered data analyst — coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

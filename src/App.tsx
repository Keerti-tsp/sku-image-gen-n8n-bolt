import { useState } from 'react';
import { Search, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageResponse {
  status: 'ok' | 'error';
  query: string;
  imageBase64?: string;
  mimeType?: string;
  message: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImageResponse | null>(null);
  const [showClarification, setShowClarification] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    if (trimmedQuery.length < 3) {
      setShowClarification(true);
      return;
    }

    setLoading(true);
    setResponse(null);
    setShowClarification(false);

    try {
      const apiUrl = `${supabaseUrl}/functions/v1/sku-image-generator`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmedQuery,
          source: 'bolt_frontend',
          metadata: {
            platform: 'amazon_marketplace',
            requestedOutput: 'binary_image',
          },
        }),
      });

      const data: ImageResponse = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        status: 'error',
        query: trimmedQuery,
        message: 'Failed to connect to the image generator. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
            SKU Image Generator
          </h1>
          <p className="text-lg text-slate-600">
            Search for Amazon supplier SKUs and generate product images
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter SKU, supplier name, or product..."
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {showClarification && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Query too short</p>
              <p className="text-sm text-amber-800">Please enter at least 3 characters to search for a SKU.</p>
            </div>
          </div>
        )}

        {response && (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              {response.status === 'ok' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-slate-900">
                  {response.status === 'ok' ? 'Success' : 'Error'}
                </p>
                <p className="text-sm text-slate-600">{response.message}</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
              <p className="text-sm font-medium text-slate-700">Query:</p>
              <p className="text-slate-600">{response.query}</p>
            </div>

            {response.status === 'ok' && response.imageBase64 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Generated Image:</p>
                <img
                  src={response.imageBase64}
                  alt={response.query}
                  className="w-full max-h-96 object-contain rounded border border-slate-300"
                />
                {response.mimeType && (
                  <p className="text-xs text-slate-500 mt-2">Format: {response.mimeType}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

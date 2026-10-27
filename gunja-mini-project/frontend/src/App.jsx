import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

function App() {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const preprocessImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Scale by 2x to improve Tesseract's reading of small screenshot text
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          const ctx = canvas.getContext('2d');
          
          // Draw scaled image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get raw pixels
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Calculate average brightness
          let totalBrightness = 0;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            totalBrightness += brightness;
          }
          const avgBrightness = totalBrightness / (canvas.width * canvas.height);
          
          // If average brightness is dark (dark mode screenshot), we MUST invert it.
          // Tesseract struggles massively with white text on dark backgrounds.
          const isDark = avgBrightness < 127;

          for (let i = 0; i < data.length; i += 4) {
            let gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            
            if (isDark) {
              gray = 255 - gray; // Invert to make it black text on white background
            }
            
            // Boost contrast to make the text pop
            gray = ((gray / 255 - 0.5) * 1.5 + 0.5) * 255;
            gray = Math.max(0, Math.min(255, gray));

            data[i] = gray;
            data[i+1] = gray;
            data[i+2] = gray;
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const extractTextFromFile = async (file) => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);
    
    try {
      const processedImageDataUrl = await preprocessImage(file);

      const { data: { text } } = await Tesseract.recognize(
        processedImageDataUrl,
        'eng',
        { logger: m => console.log(m) }
      );
      
      // Clean up the output (remove massive trailing whitespace often left by Tesseract)
      const cleanText = text.replace(/\n\s*\n/g, '\n\n').trim();
      
      setEmailText(prev => prev ? prev + '\n\n' + cleanText : cleanText);
    } catch (err) {
      setError("Failed to extract text from image: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImageUpload = async (e) => {
    await extractTextFromFile(e.target.files[0]);
    e.target.value = ''; // reset file input
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Stop image from pasting as raw data
        const file = items[i].getAsFile();
        await extractTextFromFile(file);
        break; // Process the first image found
      }
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!emailText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_text: emailText }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze email');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="text-5xl mb-4 inline-block hover:scale-110 transition-transform cursor-default opacity-90">🛡️</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight mb-3 drop-shadow-sm">
            Phishing Email Detector
          </h1>
          <p className="text-slate-400 text-lg font-medium">Machine Learning Mini Project</p>
        </div>

        {/* Side-by-Side Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Input Form Card */}
          <div className="bg-[#0a0f1a]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800 transition-all hover:border-slate-700 h-full flex flex-col">
            <form onSubmit={handleAnalyze} className="flex flex-col flex-1 gap-5">
              <div className="flex-1 flex flex-col">
                
                <div className="flex justify-between items-center mb-3">
                  <label className="flex items-center gap-2 text-slate-300 font-semibold text-lg">
                    <span className="opacity-80">📧</span> Email Text
                  </label>
                  
                  {/* OCR Image Upload */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    disabled={isExtracting}
                    className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-1.5 px-3 rounded-lg transition-all shadow-[0_2px_8px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? '👀 Scanning...' : '📸 Scan Screenshot'}
                  </button>
                </div>

                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Paste text or CTRL+V an image screenshot here to automatically extract the text..."
                  className="w-full flex-1 min-h-[300px] p-4 bg-black/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none shadow-inner"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !emailText.trim()}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 px-8 rounded-xl w-full transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? '⏳ Processing...' : '🔍 Analyze Email'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-950/30 text-red-300 border border-red-900/50 rounded-xl flex items-center gap-3">
                <span className="text-xl">❌</span>
                <div>
                  <strong className="block text-red-400">Error</strong>
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results Card */}
          <div className="bg-[#0a0f1a]/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
              <span className="opacity-80">📊</span> Analysis Result
            </h2>
            
            {/* Placeholder state when no result is loaded */}
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 min-h-[300px]">
                <div className="text-6xl opacity-30">📥</div>
                <p className="text-center font-medium">Awaiting email input...</p>
                <p className="text-sm text-center text-slate-500">Paste text or upload an image on the left, then click Analyze.</p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[300px]">
                <div className="text-5xl animate-bounce">🤔</div>
                <p className="font-semibold text-slate-200">Processing data through ML model...</p>
              </div>
            )}

            {/* Actual Result */}
            {result && !loading && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                <div className={`p-6 rounded-xl border flex flex-col sm:flex-row items-center sm:items-center gap-6 shadow-lg ${
                  result.prediction === 'phishing' 
                    ? 'bg-red-950/20 border-red-900/50 text-red-200' 
                    : 'bg-green-950/20 border-green-900/50 text-green-200'
                }`}>
                  <div className="text-7xl drop-shadow-md shrink-0">
                    {result.prediction === 'phishing' ? '🚨' : '✅'}
                  </div>
                  <div className="flex-1 text-center sm:text-left w-full">
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-black text-3xl uppercase tracking-widest ${
                        result.prediction === 'phishing' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {result.prediction}
                      </span>
                      <div className="text-right">
                        <span className="block font-bold text-2xl text-slate-200 leading-none">
                          {result.confidence_score.toFixed(1)}%
                        </span>
                        <span className="block text-xs text-slate-400 uppercase tracking-widest mt-1">
                          Confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-black/60 rounded-full h-3 mb-4 shadow-inner border border-slate-800">
                      <div 
                        className={`h-full rounded-full shadow-lg transition-all duration-1000 ${
                          result.prediction === 'phishing' 
                            ? 'bg-gradient-to-r from-red-900 to-red-600' 
                            : 'bg-gradient-to-r from-green-900 to-green-600'
                        }`}
                        style={{ width: `${result.confidence_score}%` }}
                      ></div>
                    </div>

                    <p className="text-sm opacity-90 leading-relaxed font-medium">
                      {result.prediction === 'phishing' 
                        ? 'Warning: The model has flagged this email as highly suspicious.' 
                        : 'Good news: The model indicates this email is safe.'}
                    </p>
                  </div>
                </div>

                <div className="bg-black/40 p-5 rounded-xl border border-slate-800 flex-1">
                  <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="opacity-80">🚩</span> Rule-Based Indicators
                  </h3>
                  {result.indicators.length > 0 ? (
                    <ul className="space-y-3">
                      {result.indicators.map((indicator, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 shadow-sm">
                          <span className="mt-0.5 opacity-70">👉</span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 text-sm italic bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-center">
                      No specific heuristic flags were triggered.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;

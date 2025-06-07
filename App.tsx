
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PromptInput } from './components/PromptInput';
import { GeneratedImageDisplay } from './components/GeneratedImageDisplay';
import { Spinner } from './components/Spinner';
import { generateDescriptivePrompt, generateImageFromPrompt } from './services/geminiService';
import { AppState, ImageFileWithPreview } from './types';
import { GithubIcon, SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<ImageFileWithPreview | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [intermediatePrompt, setIntermediatePrompt] = useState<string | null>(null);


  const handleImageUpload = useCallback((file: File, previewUrl: string) => {
    setUploadedImage({ file, previewUrl });
    setGeneratedImageUrl(null);
    setError(null);
    setAppState(AppState.Idle);
  }, []);

  const handleSubmit = async () => {
    if (!uploadedImage || !userPrompt.trim()) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setIntermediatePrompt(null);
    setAppState(AppState.LoadingDescriptivePrompt);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(uploadedImage.file);
      reader.onloadend = async () => {
        const base64WithPrefix = reader.result as string;
        const base64Data = base64WithPrefix.split(',')[1];
        const mimeType = uploadedImage.file.type;

        try {
            const descriptivePrompt = await generateDescriptivePrompt(base64Data, mimeType, userPrompt);
            setIntermediatePrompt(descriptivePrompt);
            setAppState(AppState.LoadingGeneratedImage);

            const imageBytes = await generateImageFromPrompt(descriptivePrompt);
            const imageUrl = `data:image/jpeg;base64,${imageBytes}`;
            setGeneratedImageUrl(imageUrl);
            setAppState(AppState.Success);
        } catch (err: any) {
            console.error('Error in generation process:', err);
            setError(err.message || 'Failed to generate image. Please check API key and try again.');
            setAppState(AppState.Error);
        } finally {
            setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read uploaded image.');
        setIsLoading(false);
        setAppState(AppState.Error);
      };

    } catch (err: any) {
      console.error('Outer error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
      setAppState(AppState.Error);
    }
  };
  
  const getApiKeyStatus = (): string => {
    // Note: In a browser environment, process.env.API_KEY might not be directly accessible
    // unless specifically injected by a build tool (e.g., Vite, Webpack).
    // For this exercise, we assume it might be undefined if not set.
    // A real app would have a more robust check or rely on server-side key management.
    if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
        return "API Key not configured. Please set the API_KEY environment variable.";
    }
    if (process.env.API_KEY === "YOUR_API_KEY" || process.env.API_KEY.length < 10) {
        return "API Key seems to be a placeholder. Please configure it correctly.";
    }
    return "API Key detected (validation not performed).";
  };
  const apiKeyStatus = getApiKeyStatus();


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100 flex flex-col items-center p-4 sm:p-8 selection:bg-sky-500 selection:text-white">
      <header className="w-full max-w-5xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 flex items-center justify-center space-x-3">
          <SparklesIcon className="w-10 h-10" />
          <span>AI Image Editor</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
            {apiKeyStatus.startsWith("API Key not") || apiKeyStatus.startsWith("API Key seems") ? 
                <span className="text-red-400">{apiKeyStatus}</span> : 
                <span className="text-green-400">Gemini API Ready</span>
            }
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-slate-700">
          <ImageUploader onImageUpload={handleImageUpload} currentImagePreview={uploadedImage?.previewUrl} />
          {uploadedImage && (
            <div className="mt-6">
              <PromptInput value={userPrompt} onChange={setUserPrompt} />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !uploadedImage || !userPrompt.trim()}
                className="mt-4 w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-lg hover:shadow-sky-500/50 disabled:shadow-none"
              >
                {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                {isLoading ? 
                    (appState === AppState.LoadingDescriptivePrompt ? 'Analyzing Image & Prompt...' : 'Generating Image...') 
                    : 'Generate Edited Image'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-slate-700">
          <GeneratedImageDisplay 
            imageUrl={generatedImageUrl} 
            isLoading={isLoading} 
            error={error}
            appState={appState}
            intermediatePrompt={intermediatePrompt}
          />
        </div>
      </main>
       <footer className="w-full max-w-5xl mt-12 text-center text-slate-500 text-sm">
        <p>Powered by Google Gemini API. This is a demo application.</p>
        <a 
            href="https://github.com/your-repo/ai-image-editor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-sky-400 hover:text-sky-300 transition-colors mt-2"
        >
            <GithubIcon className="w-4 h-4 mr-1.5" />
            View on GitHub (Placeholder)
        </a>
      </footer>
    </div>
  );
};

export default App;

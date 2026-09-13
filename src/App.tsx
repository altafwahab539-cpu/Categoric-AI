/**
 * Categoric AI - Video Generation SaaS Platform
 * Google Veo 3.1 & Gemini Architecture
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { TopNavbar } from './components/layout/TopNavbar.js';
import { PromptEditor } from './components/studio/PromptEditor.js';
import { GenerationControls } from './components/studio/GenerationControls.js';
import { WorkspacePreview } from './components/studio/WorkspacePreview.js';
import { GenerateBar } from './components/studio/GenerateBar.js';
import { StoryboardStudio } from './components/storyboard/StoryboardStudio.js';
import { MyVideos } from './components/gallery/MyVideos.js';
import { FavoritesView } from './components/gallery/FavoritesView.js';
import { TemplatesView } from './components/templates/TemplatesView.js';
import { AssetsView } from './components/assets/AssetsView.js';
import { ProjectsView } from './components/projects/ProjectsView.js';
import { BillingView } from './components/billing/BillingView.js';
import { AdminView } from './components/admin/AdminView.js';
import { AuthModal } from './components/modals/AuthModal.js';
import { ShareModal } from './components/modals/ShareModal.js';
import { VideoDetailModal } from './components/modals/VideoDetailModal.js';
import { GenerationJob, PromptTemplate } from './types.js';
import { apiRequest } from './lib/api.js';

function MainStudio() {
  const { user, wallet, refreshUserData } = useAuth();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('studio');

  // Studio parameters
  const [prompt, setPrompt] = useState<string>(
    'Cinematic slow-motion shot of a luxury golden mechanical watch movement ticking smoothly underwater, surrounded by glowing bioluminescent bubbles, ultra-realistic caustics, 8k resolution, 35mm lens.'
  );
  const [negativePrompt, setNegativePrompt] = useState<string>('blurry, jitter, low quality, artifacts');
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
  const [endImageUrl, setEndImageUrl] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [audioDescription, setAudioDescription] = useState<string>('Subtle ticking and underwater ocean resonance');
  const [dialogue, setDialogue] = useState<string>('');

  // Controls parameters
  const [modelId, setModelId] = useState<string>('veo_3_1');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [durationSeconds, setDurationSeconds] = useState<number>(6);
  const [cameraMovement, setCameraMovement] = useState<string>('Tracking Shot');
  const [lens, setLens] = useState<string>('35mm Cinematic Anamorphic');
  const [visualStyle, setVisualStyle] = useState<string>('Ultra Realistic Cinematic');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Generation state
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [shareModalJob, setShareModalJob] = useState<GenerationJob | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [detailModalJob, setDetailModalJob] = useState<GenerationJob | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Load latest completed video on first mount to populate canvas
  useEffect(() => {
    apiRequest<{ videos: GenerationJob[] }>('/api/videos?limit=1')
      .then((data) => {
        if (data.videos && data.videos.length > 0) {
          const latest = data.videos[0];
          setCurrentJob(latest);
          if (latest.output?.video_url) {
            setActiveVideoUrl(latest.output.video_url);
            setIsFavorite(latest.isFavorite || false);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Live polling for asynchronous job processing
  useEffect(() => {
    if (!currentJob) return;
    if (currentJob.status !== 'QUEUED' && currentJob.status !== 'PROCESSING') return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await apiRequest<{ job: GenerationJob }>(`/api/videos/${currentJob.id}/status`);
        if (data && data.job) {
          setCurrentJob(data.job);
          if (data.job.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            if (data.job.output?.video_url) {
              setActiveVideoUrl(data.job.output.video_url);
            }
            refreshUserData();
          } else if (data.job.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            refreshUserData();
            alert(`Generation failed: ${data.job.error_message || 'Rendering error'}. Credits refunded.`);
          }
        }
      } catch (err) {
        console.warn('Polling status error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentJob?.id, currentJob?.status]);

  // Initiate generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a generation prompt.');
      return;
    }

    setIsGenerating(true);
    setActiveVideoUrl(null);

    try {
      const payload = {
        prompt,
        enhanced_prompt: enhancedPrompt || undefined,
        negative_prompt: negativePrompt || undefined,
        model_id: modelId,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: durationSeconds,
        camera_movement: cameraMovement,
        lens,
        visual_style: visualStyle,
        audio_description: audioDescription || undefined,
        dialogue: dialogue || undefined,
        input_image_url: inputImageUrl || undefined,
        end_image_url: endImageUrl || undefined,
        reference_images: referenceImages.length > 0 ? referenceImages : undefined,
        project_id: selectedProjectId || undefined
      };

      const response = await apiRequest<{ job: GenerationJob }>('/api/videos/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCurrentJob(response.job);
      setIsFavorite(false);
      await refreshUserData();
    } catch (err: any) {
      setIsGenerating(false);
      alert(err.message || 'Generation request failed.');
    }
  };

  // Extend Video continuation
  const handleExtend = async (jobId: string) => {
    try {
      setIsGenerating(true);
      const res = await apiRequest<{ job: GenerationJob }>('/api/videos/extend', {
        method: 'POST',
        body: JSON.stringify({ originalVideoId: jobId, extensionSeconds: 7 })
      });
      setCurrentJob(res.job);
      setActiveVideoUrl(null);
      await refreshUserData();
      setCurrentTab('studio');
    } catch (err: any) {
      setIsGenerating(false);
      alert(err.message || 'Failed to extend video.');
    }
  };

  // Re-create from prompt
  const handleRegenerate = (p: string) => {
    setPrompt(p);
    setCurrentTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Apply Prompt Template
  const handleApplyTemplate = (tpl: PromptTemplate) => {
    setPrompt(tpl.prompt);
    if (tpl.negative_prompt) setNegativePrompt(tpl.negative_prompt);
    if (tpl.camera) setCameraMovement(tpl.camera);
    if (tpl.aspect_ratio) setAspectRatio(tpl.aspect_ratio);
    setCurrentTab('studio');
  };

  // Toggle favorite on current job
  const handleToggleFavorite = async (jobId: string) => {
    try {
      const res = await apiRequest<{ isFavorite: boolean }>(`/api/videos/${jobId}/favorite`, {
        method: 'POST'
      });
      setIsFavorite(res.isFavorite);
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06070a] text-zinc-100 antialiased font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar */}
        <TopNavbar
          onOpenBilling={() => setCurrentTab('billing')}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {currentTab === 'studio' && (
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
              {/* Studio Canvas & Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 5 Columns: Prompt Engineering & Directorial Controls */}
                <div className="lg:col-span-5 space-y-4">
                  <PromptEditor
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    setNegativePrompt={setNegativePrompt}
                    enhancedPrompt={enhancedPrompt}
                    setEnhancedPrompt={setEnhancedPrompt}
                    inputImageUrl={inputImageUrl}
                    setInputImageUrl={setInputImageUrl}
                    endImageUrl={endImageUrl}
                    setEndImageUrl={setEndImageUrl}
                    referenceImages={referenceImages}
                    setReferenceImages={setReferenceImages}
                    audioDescription={audioDescription}
                    setAudioDescription={setAudioDescription}
                    dialogue={dialogue}
                    setDialogue={setDialogue}
                  />

                  <GenerationControls
                    modelId={modelId}
                    setModelId={setModelId}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    resolution={resolution}
                    setResolution={setResolution}
                    durationSeconds={durationSeconds}
                    setDurationSeconds={setDurationSeconds}
                    cameraMovement={cameraMovement}
                    setCameraMovement={setCameraMovement}
                    lens={lens}
                    setLens={setLens}
                    visualStyle={visualStyle}
                    setVisualStyle={setVisualStyle}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                  />
                </div>

                {/* Right 7 Columns: Workspace Live Canvas & Generation Action */}
                <div className="lg:col-span-7 space-y-4 sticky top-0">
                  <WorkspacePreview
                    currentJob={currentJob}
                    activeVideoUrl={activeVideoUrl}
                    isGenerating={isGenerating}
                    onExtend={handleExtend}
                    onRegenerate={handleRegenerate}
                    onOpenShareModal={(job) => {
                      setShareModalJob(job);
                      setIsShareModalOpen(true);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={isFavorite}
                  />

                  <GenerateBar
                    modelId={modelId}
                    resolution={resolution}
                    isGenerating={isGenerating}
                    onGenerate={handleGenerate}
                    onOpenBilling={() => setCurrentTab('billing')}
                  />
                </div>
              </div>
            </div>
          )}

          {currentTab === 'storyboard' && (
            <StoryboardStudio onGoToVideos={() => setCurrentTab('gallery')} />
          )}

          {currentTab === 'gallery' && (
            <MyVideos
              onSelectVideo={(job) => {
                setDetailModalJob(job);
                setIsDetailModalOpen(true);
              }}
              onOpenShareModal={(job) => {
                setShareModalJob(job);
                setIsShareModalOpen(true);
              }}
              onGoToStudio={() => setCurrentTab('studio')}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesView
              onSelectVideo={(job) => {
                setDetailModalJob(job);
                setIsDetailModalOpen(true);
              }}
              onOpenShareModal={(job) => {
                setShareModalJob(job);
                setIsShareModalOpen(true);
              }}
              onGoToStudio={() => setCurrentTab('studio')}
            />
          )}

          {currentTab === 'templates' && (
            <TemplatesView onApplyTemplate={handleApplyTemplate} />
          )}

          {currentTab === 'assets' && (
            <AssetsView
              onUseAsReference={(url) => {
                setReferenceImages([...referenceImages, url]);
                setCurrentTab('studio');
              }}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              onOpenProject={(projId) => {
                setSelectedProjectId(projId);
                setCurrentTab('studio');
              }}
            />
          )}

          {currentTab === 'billing' && <BillingView />}

          {currentTab === 'admin' && <AdminView />}
        </div>
      </div>

      {/* Global Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <ShareModal
        job={shareModalJob}
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareModalJob(null);
        }}
      />

      <VideoDetailModal
        job={detailModalJob}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailModalJob(null);
        }}
        onExtend={handleExtend}
        onRegenerate={handleRegenerate}
        onOpenShareModal={(job) => {
          setShareModalJob(job);
          setIsShareModalOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainStudio />
    </AuthProvider>
  );
}

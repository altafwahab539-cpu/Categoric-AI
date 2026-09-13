/**
 * Categoric AI - Project Folders & Production Organization
 */
import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Film, Trash2, ArrowRight } from 'lucide-react';
import { Project } from '../../types.js';
import { apiRequest } from '../../lib/api.js';

interface ProjectsViewProps {
  onOpenProject: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchProjects = async () => {
    try {
      const data = await apiRequest<{ projects: Project[] }>('/api/projects');
      setProjects(data.projects || []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      });
      setName('');
      setDescription('');
      setIsCreating(false);
      await fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project? Videos inside will be unassigned.')) return;
    try {
      await apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="projects-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between bg-[#0e1017] border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Project Workspaces</h2>
            <p className="text-xs text-zinc-400">Organize multi-scene commercial shoots, product reels, and brand archives</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-[#0e1017] border border-blue-500/40 space-y-3">
          <h3 className="text-xs font-semibold text-white">Create New Project Workspace</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Name (e.g. Chadhar Burger Commercial)"
              className="bg-[#141824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="bg-[#141824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Save Project
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div
            key={proj.id}
            onClick={() => onOpenProject(proj.id)}
            className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 hover:border-blue-500/50 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => deleteProject(proj.id, e)}
                  className="text-zinc-600 hover:text-red-400 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-300 transition-colors">
                {proj.name}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {proj.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-zinc-400" />
                <span>{proj.videoCount || 0} Videos</span>
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <span>Open</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

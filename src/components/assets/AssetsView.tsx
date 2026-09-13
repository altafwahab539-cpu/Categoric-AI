/**
 * Categoric AI - Media Assets & Consistency Library
 */
import React, { useState, useEffect } from 'react';
import { Layers, Upload, Trash2, Tag, Plus, Check } from 'lucide-react';
import { MediaAsset } from '../../types.js';
import { apiRequest } from '../../lib/api.js';

interface AssetsViewProps {
  onUseAsReference?: (assetUrl: string) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ onUseAsReference }) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [category, setCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newCategory, setNewCategory] = useState<'characters' | 'products' | 'brands' | 'backgrounds' | 'other'>('characters');

  const fetchAssets = async () => {
    try {
      const query = category !== 'all' ? `?category=${category}` : '';
      const data = await apiRequest<{ assets: MediaAsset[] }>(`/api/assets${query}`);
      setAssets(data.assets || []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [category]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setIsUploading(true);
      try {
        await apiRequest('/api/assets', {
          method: 'POST',
          body: JSON.stringify({
            name: newAssetName || file.name.split('.')[0],
            category: newCategory,
            dataUrl: reader.result
          })
        });
        setNewAssetName('');
        await fetchAssets();
      } catch (err: any) {
        alert(err.message || 'Asset upload failed.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this reference asset?')) return;
    try {
      await apiRequest(`/api/assets/${id}`, { method: 'DELETE' });
      setAssets(assets.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="assets-consistency-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1017] border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Asset Consistency Library</h2>
            <p className="text-xs text-zinc-400">Keep character identity, product styling, and brand colors continuous across scenes</p>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5">
          {['all', 'characters', 'products', 'brands', 'backgrounds'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 shadow-xl">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">Add Consistency Asset</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={newAssetName}
            onChange={(e) => setNewAssetName(e.target.value)}
            placeholder="Asset Name (e.g., Protagonist Face, Smash Burger Patty)"
            className="bg-[#141824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          />
          <select
            value={newCategory}
            onChange={(e: any) => setNewCategory(e.target.value)}
            className="bg-[#141824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 capitalize"
          >
            <option value="characters">Character Reference</option>
            <option value="products">Product Hero</option>
            <option value="brands">Brand Identity / Logo</option>
            <option value="backgrounds">Key Location / Background</option>
          </select>
          <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer shadow-md shadow-blue-600/20 transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Choose Image File'}</span>
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="bg-[#0e1017] border border-white/10 rounded-xl overflow-hidden group hover:border-blue-500/40 transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-square bg-black">
              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              <button
                onClick={() => deleteAsset(asset.id)}
                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="p-2.5">
              <p className="text-xs font-semibold text-zinc-200 truncate">{asset.name}</p>
              <p className="text-[10px] text-zinc-500 capitalize">{asset.category}</p>

              {onUseAsReference && (
                <button
                  onClick={() => onUseAsReference(asset.url)}
                  className="w-full mt-2 py-1 rounded bg-white/5 hover:bg-blue-600/30 text-blue-300 text-[10px] font-medium border border-white/5 transition-colors"
                >
                  Use in Studio
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

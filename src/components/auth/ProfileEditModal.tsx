import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { uploadAvatar } from '../../lib/storage';
import { 
  X, 
  User, 
  Phone, 
  Building, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const { notifySave } = useProgress();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone_number || '');
      setInstitution(profile.institution || '');
      setAvatarUrl(profile.avatar_url || '');
      setSelectedFile(null);
      setLocalPreview(null);
      setMsg(null);
      setUploadStatus(null);
      setShowUrlInput(Boolean(profile.avatar_url && !profile.avatar_url.startsWith('data:')));
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  // Process selected image file
  const processImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'error', text: 'Format file tidak didukung. Harap pilih gambar (JPG, PNG, WebP).' });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran foto terlalu besar. Maksimum ukuran file adalah 5MB.' });
      return;
    }

    setSelectedFile(file);
    setMsg(null);

    // Create local object URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setLocalPreview(null);
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setIsSaving(true);
    setUploadStatus(null);

    let finalAvatarUrl: string | null = avatarUrl || null;

    // If user chose a file from device gallery, upload / convert it
    if (selectedFile && profile) {
      setUploadStatus('Mengunggah & mengoptimalkan foto avatar...');
      const uploadRes = await uploadAvatar(profile.id, selectedFile);
      if (uploadRes.error) {
        setIsSaving(false);
        setUploadStatus(null);
        setMsg({ type: 'error', text: uploadRes.error });
        return;
      }
      finalAvatarUrl = uploadRes.url;
    }

    setUploadStatus('Menyimpan pembaruan profil ke database...');
    const res = await updateProfile({
      full_name: fullName,
      phone_number: phone,
      institution: institution,
      avatar_url: finalAvatarUrl
    });

    setIsSaving(false);
    setUploadStatus(null);

    if (res.error) {
      setMsg({ type: 'error', text: res.error });
    } else {
      notifySave('Data profil berhasil diperbarui');
      setMsg({ type: 'success', text: 'Profil dan foto avatar berhasil diperbarui!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  // Determine current active display image
  const displayAvatar = localPreview || avatarUrl || profile?.avatar_url;

  return (
    <div 
      id="profile-edit-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="profile-edit-modal-card"
        className="comic-card bg-white rounded-3xl border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between bg-yellow-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 leading-tight">
                POW! 🎨 EDIT PROFIL & FOTO AVATAR
              </h3>
              <p className="text-xs font-bold text-slate-800">Ubah foto profil galeri, nama, dan identitas hero kamu!</p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white border-2 border-black text-slate-900 hover:bg-rose-300 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {msg && (
            <div 
              id="profile-edit-alert"
              className={`p-3.5 rounded-2xl text-xs font-black border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-2.5 ${
                msg.type === 'success' 
                  ? 'bg-emerald-300 text-emerald-950' 
                  : 'bg-rose-300 text-rose-950'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-900 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-900 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Section: Upload Foto Avatar dari Galeri */}
          <div 
            id="avatar-upload-section" 
            className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-amber-50 shadow-[3px_3px_0px_0px_#000] space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-900" />
                <span>📸 Foto Profil (Avatar Galeri)</span>
              </label>
              <span className="text-[11px] bg-yellow-200 border border-black px-2 py-0.5 rounded-md text-slate-900 font-bold">
                JPG, PNG, WebP • Maks 5MB
              </span>
            </div>

            {/* Hidden Native File Input */}
            <input
              id="avatar-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Avatar Preview & Dropzone */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview Box */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleTriggerFileInput}
                className={`relative group cursor-pointer shrink-0 rounded-2xl p-1 border-[3px] border-black transition-all shadow-[4px_4px_0px_0px_#000] ${
                  isDragging 
                    ? 'border-yellow-500 bg-yellow-200 scale-105' 
                    : 'bg-white hover:bg-yellow-50'
                }`}
                title="Klik untuk memilih foto dari galeri perangkat"
              >
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center relative border border-black/20">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={fullName || 'Avatar Profil'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-cyan-400 text-black flex items-center justify-center font-black text-3xl">
                      {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-black leading-tight">Ganti Foto Galeri</span>
                  </div>
                </div>

                {/* Corner Camera Badge */}
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-yellow-300 text-black border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000]">
                  <Upload className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Upload Controls & Description */}
              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    id="btn-choose-avatar-gallery"
                    onClick={handleTriggerFileInput}
                    className="comic-btn-primary inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih Foto dari Galeri</span>
                  </button>

                  {displayAvatar && (
                    <button
                      type="button"
                      id="btn-remove-avatar"
                      onClick={handleRemovePhoto}
                      className="comic-btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs font-black shadow-[2px_2px_0px_0px_#000] transition-colors cursor-pointer"
                      title="Hapus foto profil dan gunakan avatar inisial"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                {/* Selected File Feedback */}
                {selectedFile ? (
                  <div className="text-xs text-emerald-950 bg-emerald-200 border-2 border-black px-3 py-1.5 rounded-xl inline-flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-900 shrink-0" />
                    <span className="font-black truncate max-w-[200px]">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <span className="text-[10px] text-emerald-950 font-black bg-emerald-300 border border-black px-1.5 py-0.5 rounded">
                      SIAP SIMPAN ⭐
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 font-bold leading-relaxed">
                    Pilih foto selfie atau pas foto dari perangkatmu. Foto akan dikompres rapi dan disimpan otomatis ke Supabase Storage & tabel profil!
                  </p>
                )}
              </div>
            </div>

            {/* Optional URL Toggle */}
            <div className="pt-1">
              {!showUrlInput ? (
                <button
                  type="button"
                  id="btn-toggle-avatar-url"
                  onClick={() => setShowUrlInput(true)}
                  className="text-xs text-blue-800 hover:text-blue-950 font-black inline-flex items-center gap-1 cursor-pointer underline decoration-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Atau gunakan tautan (URL) gambar publik</span>
                </button>
              ) : (
                <div className="space-y-1 animate-fade-in bg-white p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900">
                      Tautan Gambar URL
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      id="input-avatar-url"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value);
                        setSelectedFile(null);
                        setLocalPreview(null);
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border-2 border-black bg-white focus:shadow-[2px_2px_0px_0px_#000] text-slate-900 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Identitas & Kontak */}
          <div className="space-y-3.5">
            <div>
              <label 
                htmlFor="input-profile-fullname"
                className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1"
              >
                👤 Nama Lengkap Hero
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-profile-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3.5px_3.5px_0px_0px_#000] text-slate-900 font-black transition-all"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="input-profile-phone"
                className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1"
              >
                📞 Nomor WhatsApp / Kontak Telepon
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3.5px_3.5px_0px_0px_#000] text-slate-900 font-bold transition-all"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="input-profile-institution"
                className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1"
              >
                🏛️ Asal Institusi / Kampus / Perusahaan
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-profile-institution"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: Politeknik Negeri Jakarta / PT Telkom"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] focus:shadow-[3.5px_3.5px_0px_0px_#000] text-slate-900 font-bold transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-700 font-bold">
              {uploadStatus ? (
                <span className="inline-flex items-center gap-1.5 text-blue-900 font-black bg-blue-100 px-2.5 py-1 rounded-lg border border-black">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-800" />
                  {uploadStatus}
                </span>
              ) : (
                <span className="text-[11px] text-slate-600 font-bold">
                  ⚡ Tersimpan ke Supabase & langsung aktif di seluruh markas!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-cancel-profile-edit"
                onClick={onClose}
                disabled={isSaving}
                className="comic-btn-primary px-4 py-2.5 rounded-xl text-xs font-black text-slate-900 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                BATAL
              </button>
              <button
                type="submit"
                id="btn-save-profile-changes"
                disabled={isSaving}
                className="comic-btn-primary px-5 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-black text-xs font-black border-2 border-black shadow-[3px_3px_0px_0px_#000] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>MENYIMPAN...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>SIMPAN PERUBAHAN ⭐</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

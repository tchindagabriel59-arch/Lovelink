"use client";

import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';

export default function BoutonPhoto({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    const file = fileInputRef.current.files[0];
    try {
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });
      const newBlob = await response.json();
      onUploadSuccess(newBlob.url);
      alert("Photo mise à jour !");
    } catch (error) {
      alert("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleUpload} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-pink-700 disabled:opacity-50"
      >
        <Camera className="w-4 h-4" />
        {uploading ? "Envoi..." : "Changer ma photo"}
      </button>
    </div>
  );
}

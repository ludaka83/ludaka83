"use client";
import { useState } from "react";
import useSWR from "swr";

type Lesson = {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  notesUrl?: string | null;
  presentationUrl?: string | null;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [notes, setNotes] = useState<File | null>(null);
  const [presentation, setPresentation] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const { data: lessons, isLoading, mutate } = useSWR<Lesson[]>("/api/admin/lessons", fetcher);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      if (description) formData.append("description", description);
      if (video) formData.append("video", video);
      if (notes) formData.append("notes", notes);
      if (presentation) formData.append("presentation", presentation);

      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: {
          "x-admin-password": password || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123",
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMessage("Uploaded successfully");
      setTitle("");
      setDescription("");
      setVideo(null);
      setNotes(null);
      setPresentation(null);
      mutate();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": password || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123",
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      await mutate();
      setMessage("Deleted successfully");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Upload</h1>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Admin password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium">Video (required)</label>
          <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} required />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Notes (optional)</label>
          <input type="file" accept=".pdf,.txt,.md" onChange={(e) => setNotes(e.target.files?.[0] || null)} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Presentation (optional)</label>
          <input type="file" accept=".pdf,.ppt,.pptx" onChange={(e) => setPresentation(e.target.files?.[0] || null)} />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      <div className="pt-8 space-y-3">
        <h2 className="text-xl font-semibold">Existing Lessons</h2>
        {isLoading && <p className="text-sm text-gray-600">Loading lessons...</p>}
        <div className="space-y-2">
          {(lessons || []).map((l) => (
            <div key={l.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{l.title}</p>
                <p className="text-xs text-gray-500 truncate">{new Date(l.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleDelete(l.id)}
                className="px-3 py-1.5 bg-red-600 text-white rounded disabled:opacity-50"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          ))}
          {!isLoading && (!lessons || lessons.length === 0) && (
            <p className="text-sm text-gray-600">No lessons yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";
import useSWR from "swr";
import AdSlot from "@/app/components/AdSlot";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Lesson = {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  notesUrl?: string | null;
  presentationUrl?: string | null;
  createdAt: string;
};

export default function Home() {
  const { data, isLoading } = useSWR<Lesson[]>("/api/admin/lessons", fetcher);
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const freq = Math.max(1, parseInt(process.env.NEXT_PUBLIC_ADS_FREQUENCY || "3", 10));

  const items: React.ReactNode[] = [];
  (data || []).forEach((lesson, idx) => {
    items.push(
      <div key={lesson.id} className="border rounded p-4 space-y-2">
        <h2 className="text-xl font-semibold">{lesson.title}</h2>
        {lesson.description && <p className="text-sm text-gray-600">{lesson.description}</p>}
        <video className="w-full rounded" src={lesson.videoUrl} controls preload="metadata" />
        <div className="flex gap-4 text-sm">
          {lesson.notesUrl && (
            <a className="text-blue-600 hover:underline" href={lesson.notesUrl} target="_blank">Notes</a>
          )}
          {lesson.presentationUrl && (
            <a className="text-blue-600 hover:underline" href={lesson.presentationUrl} target="_blank">Presentation</a>
          )}
        </div>
      </div>
    );
    if (adsEnabled && (idx + 1) % freq === 0 && idx !== (data!.length - 1)) {
      items.push(<AdSlot key={`ad-${idx}`} className="my-8" />);
    }
  });

  return (
    <main className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Lessons</h1>
      <AdSlot className="my-4" />
      {isLoading && <p>Loading...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items}
      </div>
    </main>
  );
}

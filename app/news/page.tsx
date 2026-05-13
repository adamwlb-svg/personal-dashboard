import { NewsView } from "@/components/news/NewsView";

export default function NewsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
      <NewsView />
    </div>
  );
}

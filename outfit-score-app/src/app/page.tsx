import dynamic from 'next/dynamic';

// Dynamically import the OutfitScorer component with no SSR
const OutfitScorer = dynamic(
  () => import('../components/OutfitScorer'),
  { ssr: false } // This ensures the component only loads on the client side
);

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Outfit Style Scorer</h1>
      <OutfitScorer />
    </div>
  );
} 
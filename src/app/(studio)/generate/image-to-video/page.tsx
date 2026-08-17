import type { Metadata } from "next";
import { ImageToVideoStudio } from "@/components/image-to-video-studio";
import { getCurrentUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";
import { listGenerations } from "@/lib/data/generations";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AI Image to Video Generator",
  description: "Animate a private image with Seedance, Veo, Kling, or LTX using source-identity lock, first-to-last-frame transitions, camera controls, native audio, and compatible output settings.",
  keywords: ["AI image to video generator", "animate image with AI", "image to video AI", "photo to video AI", "product image animation"],
  alternates: { canonical: "/generate/image-to-video" },
  openGraph: {
    title: "AI Image to Video Generator with Premium Models",
    description: "Turn a still image into a directed private video with compatible premium motion models.",
    type: "website",
    url: "/generate/image-to-video",
  },
};

export default async function ImageToVideoPage() {
  const user = await getCurrentUser();
  const [generations, credits] = user
    ? await Promise.all([
        listGenerations("image_to_video"),
        createClient().then(getCreditSummary),
      ])
    : [[], null];

  return (
    <ImageToVideoStudio
      initialCredits={credits}
      initialGenerations={generations}
      isAuthenticated={Boolean(user)}
      userId={user?.id ?? null}
    />
  );
}

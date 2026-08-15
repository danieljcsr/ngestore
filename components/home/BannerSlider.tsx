"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type BannerSlide = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  altText: string;
};

const AUTO_ADVANCE_MS = 5000;

export function BannerSlider({ banners }: { banners: BannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  function goTo(next: number) {
    setIndex((next + banners.length) % banners.length);
  }

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-2xl border border-border sm:mb-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/5]">
        {banners.map((banner, i) => {
          const content = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.imageUrl}
              alt={banner.altText}
              className="h-full w-full object-cover"
            />
          );

          return (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                i === index ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={i !== index}
            >
              {banner.linkUrl ? (
                banner.linkUrl.startsWith("/") ? (
                  <Link href={banner.linkUrl} className="block h-full w-full">
                    {content}
                  </Link>
                ) : (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full w-full"
                  >
                    {content}
                  </a>
                )
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner sebelumnya"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Banner berikutnya"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Ke banner ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

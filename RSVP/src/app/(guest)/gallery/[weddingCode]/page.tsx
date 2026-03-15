"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Photo {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: string;
  guest: { name: string } | null;
}

interface GalleryData {
  wedding: {
    brideName: string;
    groomName: string;
    primaryColorHex: string;
    secondaryColorHex: string;
  };
  photos: Photo[];
  total: number;
  page: number;
  pageSize: number;
}

export default function GalleryPage() {
  const params = useParams<{ weddingCode: string }>();
  const [data, setData] = useState<GalleryData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/gallery/${params.weddingCode}?page=${pageNum}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (pageNum === 1) {
          setPhotos(json.data.photos);
        } else {
          setPhotos((prev) => [...prev, ...json.data.photos]);
        }
        setHasMore(json.data.photos.length === json.data.pageSize);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, [params.weddingCode]);

  useEffect(() => {
    fetchPhotos(1);
  }, [fetchPhotos]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPhotos(next);
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="mx-auto mb-8 h-10 w-64" />
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="mb-4 w-full"
              style={{ height: `${150 + Math.random() * 150}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { wedding } = data;

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        background: `linear-gradient(180deg, ${wedding.primaryColorHex}08 0%, #ffffff 20%)`,
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Photo Gallery
          </p>
          <h1
            className="mt-2 text-3xl font-bold sm:text-4xl"
            style={{ color: wedding.primaryColorHex }}
          >
            {wedding.brideName} & {wedding.groomName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.total} photos shared by guests
          </p>
        </motion.div>

        {/* Masonry grid */}
        {photos.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No photos have been shared yet. Check back soon!
          </p>
        )}

        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="mb-4 break-inside-avoid overflow-hidden rounded-xl bg-white shadow-md"
            >
              <img
                src={photo.thumbnailUrl || photo.imageUrl}
                alt={photo.caption || "Wedding photo"}
                className="w-full object-cover"
                loading="lazy"
              />
              {(photo.caption || photo.guest) && (
                <div className="p-3">
                  {photo.caption && (
                    <p className="text-sm">{photo.caption}</p>
                  )}
                  {photo.guest && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {photo.guest.name}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && photos.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={loadMore}>
              Load more photos
            </Button>
          </div>
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground/50">
          Powered by WedTech &middot; Events by Athea
        </p>
      </div>
    </div>
  );
}

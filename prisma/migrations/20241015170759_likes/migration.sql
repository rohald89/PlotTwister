-- CreateTable
CREATE TABLE "MovieLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tmdbMovieId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "MovieLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MovieLike_userId_idx" ON "MovieLike"("userId");

-- CreateIndex
CREATE INDEX "MovieLike_tmdbMovieId_idx" ON "MovieLike"("tmdbMovieId");

-- CreateIndex
CREATE UNIQUE INDEX "MovieLike_userId_tmdbMovieId_key" ON "MovieLike"("userId", "tmdbMovieId");

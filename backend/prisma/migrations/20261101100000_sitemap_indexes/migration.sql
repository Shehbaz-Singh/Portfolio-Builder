-- The sitemap reads published posts newest first; this index serves that filter and order.
CREATE INDEX "Post_status_type_updatedAt_id_idx" ON "Post"("status", "type", "updatedAt", "id");

-- Redundant: the unique index on (profileId, locale, ...) already serves lookups by (profileId, locale).
DROP INDEX "Translation_profileId_locale_idx";

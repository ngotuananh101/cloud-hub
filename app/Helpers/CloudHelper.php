<?php

namespace App\Helpers;

class CloudHelper
{
    /**
     * Normalize a file or directory path.
     * Cleans up duplicate slashes and resolves '.' and '..' segments.
     * Ideal for working with Flysystem paths.
     */
    public static function normalizePath(string $path): string
    {
        // Replace backslashes with forward slashes
        $path = str_replace('\\', '/', $path);

        // Remove duplicate slashes
        $path = preg_replace('#/+#', '/', $path);

        $segments = explode('/', $path);
        $normalized = [];

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.') {
                continue;
            }
            if ($segment === '..') {
                array_pop($normalized);
            } else {
                $normalized[] = $segment;
            }
        }

        // Flysystem paths generally do not start with a slash
        return implode('/', $normalized);
    }

    /**
     * Generate a unique cache key for a cloud connection and path.
     */
    public static function getCacheKey($connection, string $path): string
    {
        $connectionId = is_object($connection) ? $connection->id : $connection;
        $normalizedPath = self::normalizePath($path);

        return "cloud_storage:{$connectionId}:".md5($normalizedPath ?: '/');
    }

    /**
     * Get cached cloud contents.
     */
    public static function getCloudCache($connection, string $path)
    {
        return cache()->get(self::getCacheKey($connection, $path));
    }

    /**
     * Store cloud contents in cache.
     */
    public static function setCloudCache($connection, string $path, array $contents, int $ttlSeconds = 3600): void
    {
        cache()->put(self::getCacheKey($connection, $path), $contents, $ttlSeconds);
    }

    /**
     * Clear cloud cache for a specific path.
     */
    public static function clearCloudCache($connection, string $path): void
    {
        cache()->forget(self::getCacheKey($connection, $path));
    }

    /**
     * Remember cloud contents in cache.
     */
    public static function rememberCloudContents($connection, string $path, \Closure $callback, int $ttlSeconds = 3600)
    {
        return cache()->remember(
            self::getCacheKey($connection, $path),
            $ttlSeconds,
            $callback
        );
    }

    /**
     * Encode a path to a URL-safe Base64 string.
     */
    public static function encodePath(string $path): string
    {
        $normalized = self::normalizePath($path);
        if ($normalized === '' || $normalized === '/') {
            return '';
        }

        return rtrim(strtr(base64_encode($normalized), '+/', '-_'), '=');
    }

    /**
     * Decode a URL-safe Base64 string back to a path.
     */
    public static function decodePath(?string $hash): string
    {
        if (empty($hash) || $hash === 'root') {
            return '/';
        }

        $decoded = base64_decode(strtr($hash, '-_', '+/'));
        return $decoded ?: '/';
    }
}

<?php

namespace App\Filesystem\OneDrive;

use Illuminate\Filesystem\FilesystemAdapter;
use League\Flysystem\Filesystem;

class LaravelOneDriveAdapter extends FilesystemAdapter
{
    /**
     * Determine if temporary URLs can be generated.
     *
     * @return bool
     */
    public function providesTemporaryUrls()
    {
        return true;
    }

    /**
     * Get a temporary URL for the file at the given path.
     *
     * @param  string  $path
     * @param  \DateTimeInterface  $expiration
     * @param  array  $options
     * @return string
     */
    public function temporaryUrl($path, $expiration, array $options = [])
    {
        // Get the underlying OneDriveAdapter
        $adapter = $this->adapter;
        
        if (method_exists($adapter, 'temporaryUrl')) {
            return $adapter->temporaryUrl($path, $expiration, $options);
        }

        throw new \RuntimeException('This driver does not support creating temporary URLs.');
    }
}

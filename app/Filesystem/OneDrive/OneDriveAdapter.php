<?php

namespace App\Filesystem\OneDrive;

use League\Flysystem\Config;
use League\Flysystem\FileAttributes;
use League\Flysystem\DirectoryAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\PathPrefixer;
use League\Flysystem\StorageAttributes;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToWriteFile;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToListContents;
use League\Flysystem\UnableToCopyFile;
use League\Flysystem\UnableToMoveFile;
use GuzzleHttp\Exception\ClientException;

class OneDriveAdapter implements FilesystemAdapter
{
    protected OneDriveClient $client;
    protected PathPrefixer $prefixer;

    public function __construct(OneDriveClient $client, string $prefix = '')
    {
        $this->client = $client;
        $this->prefixer = new PathPrefixer($prefix);
    }

    public function fileExists(string $path): bool
    {
        try {
            $metadata = $this->client->getMetadata($this->prefixer->prefixPath($path));
            return !isset($metadata['folder']);
        } catch (ClientException $e) {
            if ($e->getResponse()->getStatusCode() === 404) {
                return false;
            }
            throw $e;
        }
    }

    public function directoryExists(string $path): bool
    {
        try {
            $metadata = $this->client->getMetadata($this->prefixer->prefixPath($path));
            return isset($metadata['folder']);
        } catch (ClientException $e) {
            if ($e->getResponse()->getStatusCode() === 404) {
                return false;
            }
            throw $e;
        }
    }

    public function write(string $path, string $contents, Config $config): void
    {
        try {
            $this->client->upload($this->prefixer->prefixPath($path), $contents);
        } catch (\Exception $e) {
            throw UnableToWriteFile::atLocation($path, $e->getMessage(), $e);
        }
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        try {
            $this->client->upload($this->prefixer->prefixPath($path), $contents);
        } catch (\Exception $e) {
            throw UnableToWriteFile::atLocation($path, $e->getMessage(), $e);
        }
    }

    public function read(string $path): string
    {
        try {
            return $this->client->download($this->prefixer->prefixPath($path))->getContents();
        } catch (\Exception $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage(), $e);
        }
    }

    public function readStream(string $path)
    {
        try {
            return $this->client->download($this->prefixer->prefixPath($path))->detach();
        } catch (\Exception $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage(), $e);
        }
    }

    public function delete(string $path): void
    {
        try {
            $this->client->delete($this->prefixer->prefixPath($path));
        } catch (ClientException $e) {
            if ($e->getResponse()->getStatusCode() === 404) {
                return;
            }
            throw UnableToDeleteFile::atLocation($path, $e->getMessage(), $e);
        }
    }

    public function deleteDirectory(string $path): void
    {
        $this->delete($path);
    }

    public function createDirectory(string $path, Config $config): void
    {
        try {
            $this->client->createDirectory($this->prefixer->prefixPath($path));
        } catch (\Exception $e) {
            // Already exists or other error
        }
    }

    public function setVisibility(string $path, string $visibility): void
    {
        // Not supported/implemented for OneDrive
    }

    public function visibility(string $path): FileAttributes
    {
        return new FileAttributes($path, null, 'private');
    }

    public function mimeType(string $path): FileAttributes
    {
        return $this->getFileAttributes($path);
    }

    public function lastModified(string $path): FileAttributes
    {
        return $this->getFileAttributes($path);
    }

    public function fileSize(string $path): FileAttributes
    {
        return $this->getFileAttributes($path);
    }

    public function listContents(string $path, bool $deep): iterable
    {
        try {
            $children = $this->client->listChildren($this->prefixer->prefixPath($path));
            
            foreach ($children as $child) {
                $childPath = $this->prefixer->stripPrefix($path . '/' . $child['name']);
                $childPath = trim($childPath, '/');

                if (isset($child['folder'])) {
                    yield new DirectoryAttributes(
                        $childPath,
                        'private',
                        strtotime($child['lastModifiedDateTime'])
                    );
                } else {
                    yield new FileAttributes(
                        $childPath,
                        $child['size'],
                        'private',
                        strtotime($child['lastModifiedDateTime']),
                        $child['file']['mimeType'] ?? null
                    );
                }

                if ($deep && isset($child['folder'])) {
                    yield from $this->listContents($childPath, true);
                }
            }
        } catch (\Exception $e) {
            throw new UnableToListContents($e->getMessage(), 0, $e);
        }
    }

    public function move(string $source, string $destination, Config $config): void
    {
        try {
            $this->client->move(
                $this->prefixer->prefixPath($source),
                $this->prefixer->prefixPath($destination)
            );
        } catch (\Exception $e) {
            throw UnableToMoveFile::fromLocationTo($source, $destination, $e);
        }
    }

    public function copy(string $source, string $destination, Config $config): void
    {
        try {
            $this->client->copy(
                $this->prefixer->prefixPath($source),
                $this->prefixer->prefixPath($destination)
            );
        } catch (\Exception $e) {
            throw UnableToCopyFile::fromLocationTo($source, $destination, $e);
        }
    }

    protected function getFileAttributes(string $path): FileAttributes
    {
        try {
            $metadata = $this->client->getMetadata($this->prefixer->prefixPath($path));
            
            return new FileAttributes(
                $path,
                $metadata['size'] ?? null,
                'private',
                isset($metadata['lastModifiedDateTime']) ? strtotime($metadata['lastModifiedDateTime']) : null,
                $metadata['file']['mimeType'] ?? null
            );
        } catch (\Exception $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage(), $e);
        }
    }

    public function providesTemporaryUrls(): bool
    {
        return true;
    }

    public function temporaryUrl(string $path, \DateTimeInterface|string $expiration, array $options = []): string
    {
        try {
            $metadata = $this->client->getMetadata($this->prefixer->prefixPath($path));

            if (isset($metadata['@microsoft.graph.downloadUrl'])) {
                return $metadata['@microsoft.graph.downloadUrl'];
            }

            throw new \RuntimeException('OneDrive did not return a download URL.');
        } catch (\Exception $e) {
            throw new \RuntimeException('Unable to generate temporary URL: ' . $e->getMessage(), 0, $e);
        }
    }
}

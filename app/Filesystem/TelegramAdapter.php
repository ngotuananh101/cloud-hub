<?php

namespace App\Filesystem;

use GuzzleHttp\Client;
use League\Flysystem\Config;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\PathPrefixer;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToListContents;
use League\Flysystem\UnableToMoveFile;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToWriteFile;

class TelegramAdapter implements FilesystemAdapter
{
    protected Client $client;

    protected string $sessionId;

    protected string $baseUrl;

    protected string $token;

    protected PathPrefixer $prefixer;

    public function __construct(string $sessionId, string $token, string $prefix = '')
    {
        $this->baseUrl = rtrim(config('cloud-hub.providers.telegram.base_url'), '/');
        $this->token = $token;
        $this->sessionId = $sessionId;
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'X-Token' => $this->token,
                'X-Session-ID' => $this->sessionId,
            ],
        ]);
        $this->prefixer = new PathPrefixer($prefix);
    }

    public function fileExists(string $path): bool
    {
        try {
            $this->client->get('/metadata', ['query' => ['path' => $this->prefixer->prefixPath($path)]]);

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function directoryExists(string $path): bool
    {
        // Check if any file has this path as a prefix
        $pattern = rtrim($this->prefixer->prefixPath($path), '/').'/';
        try {
            $response = $this->client->get('/list', ['query' => ['directory' => $pattern]]);
            $files = json_decode($response->getBody()->getContents(), true);

            return count($files) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function write(string $path, string $contents, Config $config): void
    {
        try {
            $this->client->post('/write', [
                'query' => ['path' => $this->prefixer->prefixPath($path)],
                'multipart' => [
                    [
                        'name' => 'file',
                        'contents' => $contents,
                        'filename' => basename($path),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            throw UnableToWriteFile::atLocation($path, $e->getMessage(), $e);
        }
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        $this->write($path, stream_get_contents($contents), $config);
    }

    public function read(string $path): string
    {
        try {
            $response = $this->client->get('/read', ['query' => ['path' => $this->prefixer->prefixPath($path)]]);

            return $response->getBody()->getContents();
        } catch (\Exception $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage());
        }
    }

    public function readStream(string $path)
    {
        try {
            $response = $this->client->get('/read', [
                'query' => ['path' => $this->prefixer->prefixPath($path)],
                'stream' => true,
            ]);

            return $response->getBody()->detach();
        } catch (\Exception $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage());
        }
    }

    public function delete(string $path): void
    {
        try {
            $this->client->delete('/delete', ['query' => ['path' => $this->prefixer->prefixPath($path)]]);
        } catch (\Exception $e) {
            throw UnableToDeleteFile::atLocation($path, $e->getMessage(), $e);
        }
    }

    public function deleteDirectory(string $path): void
    {
        // Not implemented for flat storage
    }

    public function createDirectory(string $path, Config $config): void
    {
        // Not needed for flat storage
    }

    public function setVisibility(string $path, string $visibility): void
    {
        // Not supported
    }

    public function visibility(string $path): FileAttributes
    {
        return new FileAttributes($path, null, 'private');
    }

    public function mimeType(string $path): FileAttributes
    {
        return $this->getMetadata($path);
    }

    public function lastModified(string $path): FileAttributes
    {
        return $this->getMetadata($path);
    }

    public function fileSize(string $path): FileAttributes
    {
        return $this->getMetadata($path);
    }

    public function listContents(string $path, bool $deep): iterable
    {
        try {
            $response = $this->client->get('/list', ['query' => ['directory' => $this->prefixer->prefixPath($path)]]);
            $files = json_decode($response->getBody()->getContents(), true);

            foreach ($files as $file) {
                yield new FileAttributes(
                    $this->prefixer->stripPrefix($file['path']),
                    $file['size'],
                    'private',
                    strtotime($file['created_at'])
                );
            }
        } catch (\Exception $e) {
            throw new UnableToListContents($e->getMessage(), 0, $e);
        }
    }

    public function move(string $source, string $destination, Config $config): void
    {
        // We can optimize this if the microservice supports renaming,
        // but for now, we follow the Flysystem default: copy + delete.
        try {
            $this->copy($source, $destination, $config);
            $this->delete($source);
        } catch (\Exception $e) {
            throw UnableToMoveFile::fromLocationTo($source, $destination, $e);
        }
    }

    public function copy(string $source, string $destination, Config $config): void
    {
        $this->write($destination, $this->read($source), $config);
    }

    protected function getMetadata(string $path): FileAttributes
    {
        try {
            $response = $this->client->get('/metadata', ['query' => ['path' => $this->prefixer->prefixPath($path)]]);
            $data = json_decode($response->getBody()->getContents(), true);

            return new FileAttributes(
                $path,
                $data['size'],
                'private',
                strtotime($data['created_at']),
                $data['mime_type']
            );
        } catch (\Exception $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage());
        }
    }
}
